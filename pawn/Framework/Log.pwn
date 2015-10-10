// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * What are the log levels with which notices can be outputted to the console? The log verbosity
 * level can be changed during runtime, which will influence the amount of output to the console.
 */
enum LogMessageLevel {
    CriticalMessage,
    ErrorMessage,
    WarningMessage,
    InformationMessage,
    DebugMessage
};

/**
 * 
 *
 * Logs should have a uniform, clear and parsable format, to make them as convenient as possible. To
 * ensure that people follow this, usage of the "printf" function will be considered illegal in
 * most of the general code, except for the sole purpose of debugging.
 *
 * Output of the various debug levels will be as follows:
 *
 * CRITICAL [section] message
 * ERROR    [section] message
 * WARNING  [section] message
 * INFO     [section] message
 * DEBUG    [section] message
 *
 * No timestamps will be inserted in the log strings by this class, as San Andreas: Multiplayer's
 * log system will take care of that for us.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class Log {
};
