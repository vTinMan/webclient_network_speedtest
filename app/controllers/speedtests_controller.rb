class SpeedtestsController < ApplicationController
  def new
    @file_url = ENV['SPEEDTEST_FILE']
  end

  def create
    Rails.logger.silence do
      head 200
    end
  end

  def show
    send_file Rails.root.join('public', ENV['SPEEDTEST_FILE'])
  end
end
