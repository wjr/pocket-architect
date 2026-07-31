# frozen_string_literal: true

require "json"
require "minitest/autorun"
require "tmpdir"
require_relative "../lib/pocket_architect/image_generator"

class FakeImages
  attr_reader :calls

  def initialize
    @calls = []
  end

  def generate(arguments)
    @calls << arguments
    { "id" => "fake-request", "data" => [{ "b64_json" => ["hello"].pack("m0") }] }
  end
end

class FakeClient
  attr_reader :images

  def initialize
    @images = FakeImages.new
  end
end

class ImageGeneratorTest < Minitest::Test
  ROOT = File.expand_path("..", __dir__)
  PROMPT_FILE = File.join(ROOT, "image-gen-prompt.json")

  def setup
    @library = PocketArchitect::PromptLibrary.new(PROMPT_FILE)
    @tmpdir = Dir.mktmpdir("pocket-architect-images")
  end

  def teardown
    FileUtils.remove_entry(@tmpdir)
  end

  def test_prompt_library_has_all_constraints
    assert_equal 44, @library.prompts.length
    assert_equal %w[building perspective placement], @library.prompts.map { |p| p["category"] }.uniq.sort
    assert_equal 44, @library.prompts.map { |p| p["id"] }.uniq.length
  end

  def test_effective_prompt_contains_shared_style_and_negative_constraints
    effective = @library.effective_prompt(@library.prompts.first)
    assert_includes effective, "Pure black and white only"
    assert_includes effective, "Negative constraints:"
    assert_includes effective, "No color"
  end

  def test_pilot_selects_one_prompt_per_category
    pilot = @library.select(pilot: true)
    assert_equal %w[building perspective placement], pilot.map { |p| p["category"] }.sort
  end

  def test_cost_estimator_matches_current_image_estimates
    assert_in_delta 0.264, PocketArchitect::CostEstimator.estimate(44, "low"), 0.0001
    assert_in_delta 2.332, PocketArchitect::CostEstimator.estimate(44, "medium"), 0.0001
  end

  def test_budget_is_checked_before_any_api_call
    client = FakeClient.new
    generator = build_generator(client)
    assert_raises(PocketArchitect::BudgetError) do
      generator.generate(@library.select(pilot: true), max_cost: 0.001)
    end
    assert_empty client.images.calls
  end

  def test_generation_writes_output_and_manifest
    client = FakeClient.new
    generator = build_generator(client)
    result = generator.generate([@library.prompts.first], max_cost: 1)
    path = result.first["path"]
    assert_equal "generated", result.first["status"]
    assert_equal "fake-request", result.first["request_id"]
    assert File.file?(path)
    assert_equal "hello", File.binread(path)
    assert JSON.parse(File.read(File.join(@tmpdir, "manifest.json"))).key?(@library.prompts.first["id"])
    assert_equal 1, client.images.calls.length
  end

  def test_matching_completed_image_is_skipped
    client = FakeClient.new
    generator = build_generator(client)
    prompt = @library.prompts.first
    generator.generate([prompt], max_cost: 1)
    result = generator.generate([prompt], max_cost: 1)
    assert_equal "skipped", result.first[:status]
    assert_equal 1, client.images.calls.length
  end

  def test_force_regenerates_completed_image
    client = FakeClient.new
    generator = build_generator(client)
    prompt = @library.prompts.first
    generator.generate([prompt], max_cost: 1)
    generator.generate([prompt], max_cost: 1, force: true)
    assert_equal 2, client.images.calls.length
  end

  def test_invalid_prompt_library_is_rejected
    path = File.join(@tmpdir, "invalid.json")
    File.write(path, JSON.generate("prompts" => []))
    assert_raises(PocketArchitect::ConfigurationError) { PocketArchitect::PromptLibrary.new(path) }
  end

  private

  def build_generator(client)
    PocketArchitect::ImageGenerator.new(library: @library, client: client, output_dir: File.join(@tmpdir, "constraints"),
                                        manifest_path: File.join(@tmpdir, "manifest.json"))
  end
end
