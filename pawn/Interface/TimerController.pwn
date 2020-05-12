// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

forward OnHighResolutionTimerTick();
forward OnSecondTimerTick();
forward OnMinuteTimerTick();

// This function will be invoked at an interval of 250 milliseconds.
public OnHighResolutionTimerTick() {
    TimerController->processControlHighResolutionTimer();
}

// This function will be invoked at an interval of one second.
public OnSecondTimerTick() {
    TimerController->processControlSecondTimer();
}

// This function will be invoked at an interval of one minute.
public OnMinuteTimerTick() {
    TimerController->processControlMinuteTimer();
}

/**
 * The Timer Controller will manage dispatching of function invocations at given intervals, lists
 * for which will be created during compile time by the PreCompiler. Because SA-MP's implementation
 * of timers is less than ideal, we'll be curating only three actual timers, and using counters to
 * create virtual timers. Shortest interval is 250ms, the longest is a minute.
 *
 * Using a timer for your feature should be done by using an invocation list annotation. The
 * available invocation lists are as follows:
 *
 * HighResolutionTimer  - Invoked every 250 milliseconds.
 * SecondTimer          - Invoked every second.
 * SecondTimerPerPlayer - Invoked every second for each online player.
 * TwoSecondTimer       - Invoked every two seconds.
 * FiveSecondTimer      - Invoked every five seconds.
 * TenSecondTimer       - Invoked every ten seconds.
 * MinuteTimer          - Invoked every minute.
 * MinuteTimerPerPlayer - Invoked every minute for each online player.
 *
 * As an example, a method that should be invoked every second could be written down as this:
 *
 * class MyFeature {
 *     @list(SecondTimer)
 *     public processControl() {
 *         printf("Hello, World!");
 *     }
 * };
 *
 * Note that the ten and thirty second tickers don't start ticking at zero. We do this to make sure
 * that there won't be four timers running in a single iteration, thus spreading the load.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class TimerController {
    // Ticker to manage invocation interval for two-second timers.
    new m_twoSecondTimerTicker = 0;

    // Ticker to manage invocation interval for five-second timers.
    new m_fiveSecondTimerTicker = 0;

    // Ticker to manage invocation interval for ten-second timers.
    new m_tenSecondTimerTicker = 1;

    /**
     * During initialization of this class, we'll create the two primary timers that will be used
     * within the gamemode.
     */
    public __construct() {
        SetTimer("OnHighResolutionTimerTick", 250, 1);
        SetTimer("OnSecondTimerTick", 1000, 1);
        SetTimer("OnMinuteTimerTick", 60 * 1000 + 500, 1);
    }

    /**
     * The high resolution timer will be invoked once per 250 milliseconds. There should only be a
     * few methods which require this sort of high-resolution processing, as it can be hard for the
     * server to cope with heavy processing during high player loads.
     */
    public processControlHighResolutionTimer() {
        Annotation::ExpandList<HighResolutionTimer>();
    }

    /**
     * The second timer is in charge of most general processing, and will be used to manage the per-
     * second, two-second, ten-second and thirty-second timers. 
     */
    public processControlSecondTimer() {
        if (++m_twoSecondTimerTicker == 2) {
            Annotation::ExpandList<TwoSecondTimer>();

            Check_Textdraw();  // Bag of Cash text-draw visibility check

            m_twoSecondTimerTicker = 0;
        }

        if (++m_fiveSecondTimerTicker == 5) {
            Annotation::ExpandList<FiveSecondTimer>();

            m_fiveSecondTimerTicker = 0;
        }

        if (++m_tenSecondTimerTicker == 10) {
            Annotation::ExpandList<TenSecondTimer>();

            m_tenSecondTimerTicker = 0;
        }

        Annotation::ExpandList<SecondTimer>();

        // Now iterate through the online players and invoke the per-second per-player invocation
        // list, with the player's Id as the first and only argument.
        for (new playerId = 0; playerId <= PlayerManager->highestPlayerId(); ++playerId) {
            if (Player(playerId)->isConnected() == false)
                continue;

            Annotation::ExpandList<SecondTimerPerPlayer>(playerId);
        }
    }

    /**
     * The minute-timer is for features that do not operate on a strict time schedule, such as the
     * Tax Agencies and reaction tests. There is no division in timer functionality here, as we can
     * spare a function invocation each minute for features to decide they'd like to punt it.
     */
    public processControlMinuteTimer() {
        Annotation::ExpandList<MinuteTimer>();
    }
};
