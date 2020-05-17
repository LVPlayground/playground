# Notes
This document contains a series of notes and commands we've collected over the years for making
building all of our plugins and dependencies as easy as possible.

## Compiling the various plugins on Linux
### samp-streamer-plugin
  $ git clone https://github.com/samp-incognito/samp-streamer-plugin.git
  $ cd samp-streamer-plugin
  $ git submodule update --init --recursive . ":(exclude)lib/boost"
  $ mkdir build && cd build
  $ cmake .. -DBOOST_ROOT=/opt/boost_1_73_0_32bit -DCMAKE_BUILD_TYPE=Release
  $ make streamer_unity
