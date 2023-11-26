## Network speed test
The html-form and js-script to test network speed: uploading, downloading from app, downloading from storage.

## Getting started
To configure an application locally - create a heavy file (about 10Mb) in `public` and specify its name in `SPEEDTEST_FILE` env variable

    export SPEEDTEST_FILE=big_instance

Install gems

    bundle install

And application can be run

    bundle exec rails s
