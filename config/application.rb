require_relative 'boot'

require "action_controller/railtie"

Bundler.require(*Rails.groups)

module ExpSpeedtestRb
  class Application < Rails::Application
    config.load_defaults 5.1
  end
end
