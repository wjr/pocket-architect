# frozen_string_literal: true

require "base64"
require "digest"
require "fileutils"
require "json"
require "time"

module PocketArchitect
  class ConfigurationError < StandardError; end
  class BudgetError < StandardError; end
  class GenerationError < StandardError; end

  class PromptLibrary
    REQUIRED_CATEGORIES = %w[building placement perspective].freeze
    attr_reader :source_path, :version, :canvas, :global_style_prompt, :global_negative_prompt, :prompts

    def initialize(source_path)
      @source_path = File.expand_path(source_path)
      raise ConfigurationError, "Prompt file not found: #{@source_path}" unless File.file?(@source_path)
      document = JSON.parse(File.read(@source_path))
      @version = document.fetch("version")
      @canvas = document.fetch("canvas")
      @global_style_prompt = document.fetch("global_style_prompt")
      @global_negative_prompt = document.fetch("global_negative_prompt")
      @prompts = document.fetch("prompts")
      validate!
    rescue JSON::ParserError => e
      raise ConfigurationError, "Invalid prompt JSON: #{e.message}"
    rescue KeyError => e
      raise ConfigurationError, "Prompt JSON is missing #{e.message}"
    end

    def validate!
      raise ConfigurationError, "Prompt library must contain 44 prompts" unless prompts.length == 44
      raise ConfigurationError, "Canvas must be 1024x1024" unless canvas["width"] == 1024 && canvas["height"] == 1024
      raise ConfigurationError, "Canvas must be square" unless canvas["aspect_ratio"] == "1:1"
      raise ConfigurationError, "Global style prompt is empty" if global_style_prompt.strip.empty?
      raise ConfigurationError, "Global negative prompt is empty" if global_negative_prompt.strip.empty?
      ids = prompts.map { |prompt| prompt.fetch("id") }
      raise ConfigurationError, "Prompt IDs must be unique" unless ids.uniq.length == ids.length
      categories = prompts.map { |prompt| prompt.fetch("category") }
      missing = REQUIRED_CATEGORIES - categories.uniq
      raise ConfigurationError, "Missing categories: #{missing.join(", ")}" unless missing.empty?
      prompts.each do |prompt|
        %w[id category value prompt].each do |key|
          raise ConfigurationError, "Prompt #{prompt["id"] || "unknown"} is missing #{key}" if prompt[key].to_s.strip.empty?
        end
        unless REQUIRED_CATEGORIES.include?(prompt["category"])
          raise ConfigurationError, "Unknown category: #{prompt["category"]}"
        end
      end
    end

    def select(ids: nil, category: nil, limit: nil, pilot: false)
      selected = prompts
      selected = selected.select { |prompt| ids.include?(prompt.fetch("id")) } if ids&.any?
      selected = selected.select { |prompt| prompt.fetch("category") == category } if category
      selected = prompts.select { |prompt| %w[building-garden-shed placement-flat-open-field perspective-elevation].include?(prompt.fetch("id")) } if pilot
      selected = selected.first(limit) if limit
      raise ConfigurationError, "No prompts matched the selection" if selected.empty?
      selected
    end

    def effective_prompt(prompt)
      [global_style_prompt, prompt.fetch("prompt"), "Negative constraints: #{global_negative_prompt}"].join("\n\n")
    end
  end

  class CostEstimator
    PRICES = { "low" => 0.006, "medium" => 0.053, "high" => 0.211 }.freeze

    def self.price_for(quality)
      PRICES.fetch(quality) { raise ConfigurationError, "Unsupported quality: #{quality}" }
    end

    def self.estimate(count, quality)
      (count * price_for(quality)).round(6)
    end
  end

  class Manifest
    def initialize(path)
      @path = File.expand_path(path)
      @entries = File.file?(@path) ? JSON.parse(File.read(@path)) : {}
      raise ConfigurationError, "Manifest must contain an object" unless @entries.is_a?(Hash)
    rescue JSON::ParserError => e
      raise ConfigurationError, "Invalid manifest JSON: #{e.message}"
    end

    def completed?(id, fingerprint, output_path)
      entry = @entries[id]
      entry && entry["status"] == "generated" && entry["fingerprint"] == fingerprint && File.file?(output_path)
    end

    def record(id, attributes)
      @entries[id] = attributes
      FileUtils.mkdir_p(File.dirname(@path))
      File.write(@path, JSON.pretty_generate(@entries) + "\n")
    end
  end

  class ImageGenerator
    attr_reader :library, :model, :quality, :size, :output_format

    def initialize(library:, client:, output_dir:, manifest_path:, model: "gpt-image-2", quality: "low",
                   size: "1024x1024", output_format: "png", clock: Time)
      @library = library
      @client = client
      @output_dir = File.expand_path(output_dir)
      @manifest = Manifest.new(manifest_path)
      @model = model
      @quality = quality
      @size = size
      @output_format = output_format
      @clock = clock
      CostEstimator.price_for(quality)
      raise ConfigurationError, "Only 1024x1024 output is supported" unless size == "1024x1024"
      raise ConfigurationError, "Only PNG output is supported" unless output_format == "png"
    end

    def fingerprint(prompt)
      Digest::SHA256.hexdigest([model, quality, size, output_format, library.effective_prompt(prompt)].join("\0"))
    end

    def output_path(prompt)
      File.join(@output_dir, prompt.fetch("category"), "#{prompt.fetch("id")}.png")
    end

    def generate(prompts, max_cost: nil, force: false)
      estimate = CostEstimator.estimate(prompts.length, quality)
      raise BudgetError, format("Estimated cost $%.3f exceeds max cost $%.3f", estimate, max_cost) if max_cost && estimate > max_cost
      results = []
      prompts.each do |prompt|
        path = output_path(prompt)
        hash = fingerprint(prompt)
        if !force && @manifest.completed?(prompt.fetch("id"), hash, path)
          results << { id: prompt.fetch("id"), status: "skipped", path: path }
          next
        end
        begin
          response = @client.images.generate(model: model, prompt: library.effective_prompt(prompt), size: size,
                                             quality: quality, n: 1, output_format: output_format)
          base64_data = extract_base64(response)
          raise GenerationError, "OpenAI response did not contain image data" if base64_data.to_s.empty?
          FileUtils.mkdir_p(File.dirname(path))
          File.binwrite(path, Base64.decode64(base64_data))
          entry = {
            "id" => prompt.fetch("id"), "category" => prompt.fetch("category"), "value" => prompt.fetch("value"),
            "status" => "generated", "review" => "pending", "path" => path, "fingerprint" => hash,
            "model" => model, "quality" => quality, "size" => size, "output_format" => output_format,
            "created_at" => @clock.now.utc.iso8601
          }
          request_id = field(response, "id")
          entry["request_id"] = request_id if request_id
          @manifest.record(prompt.fetch("id"), entry)
          results << entry
        rescue StandardError => e
          @manifest.record(prompt.fetch("id"), { "id" => prompt.fetch("id"), "status" => "failed",
                                                  "error" => e.message, "fingerprint" => hash,
                                                  "created_at" => @clock.now.utc.iso8601 })
          raise GenerationError, "#{prompt.fetch("id")}: #{e.message}"
        end
      end
      results
    end

    private

    def extract_base64(response)
      data = field(response, "data")
      item = data&.first
      value = field(item, "b64_json")
      return value if value
      nil
    end

    def field(object, name)
      return nil unless object
      return object.public_send(name) if object.respond_to?(name)
      return object[name.to_sym] if object.respond_to?(:key?) && object.key?(name.to_sym)
      return object[name] if object.respond_to?(:key?) && object.key?(name)

      nil
    end
  end
end
