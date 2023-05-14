Rails.application.routes.draw do
  root 'speedtests#new'

  resource :speedtest
end
