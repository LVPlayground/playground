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

#if Debug::EnableTimerDebugging

    // Resource Id of the High Resolution timer.
    new m_highResolutionTimer = 0;

    // Resource Id of the timer which runs at a second's interval.
    new m_secondTimer = 0;

    // Resource Id of the timer which runs at a minute's interval.
    new m_minuteTimer = 0;

    // Start time, in server ticks, of the current timer.
    new m_currentTimerStart = 0;

    // Interval of the current timer, for identification.
    new m_currentTimerInterval = 0;

#endif

    /**
     * During initialization of this class, we'll create the two primary timers that will be used
     * within the gamemode.
     */
    public __construct() {
#if Debug::EnableTimerDebugging
        m_highResolutionTimer = SetTimer("OnHighResolutionTimerTick", 250, 1);
        m_secondTimer = SetTimer("OnSecondTimerTick", 1000, 1);
        m_minuteTimer = SetTimer("OnMinuteTimerTick", 60 * 1000 + 500, 1);
#else
        SetTimer("OnHighResolutionTimerTick", 250, 1);
        SetTimer("OnSecondTimerTick", 1000, 1);
        SetTimer("OnMinuteTimerTick", 60 * 1000 + 500, 1);
#endif
    }

    /**
     * The high resolution timer will be invoked once per 250 milliseconds. There should only be a
     * few methods which require this sort of high-resolution processing, as it can be hard for the
     * server to cope with heavy processing during high player loads.
     */
    public processControlHighResolutionTimer() {
        this->beforeRunTimer(250);
        Annotation::ExpandList<HighResolutionTimer>();
        this->afterRunTimer();
    }

    /**
     * The second timer is in charge of most general processing, and will be used to manage the per-
     * second, two-second, ten-second and thirty-second timers. 
     */
    public processControlSecondTimer() {
        if (++m_twoSecondTimerTicker == 2) {
            this->beforeRunTimer(2000);
            Annotation::ExpandList<TwoSecondTimer>();
            this->afterRunTimer();

            Check_Textdraw();  // Bag of Cash text-draw visibility check

            m_twoSecondTimerTicker = 0;
        }

        if (++m_fiveSecondTimerTicker == 5) {
            this->beforeRunTimer(5000);
            Annotation::ExpandList<FiveSecondTimer>();
            this->afterRunTimer();

            m_fiveSecondTimerTicker = 0;
        }

        if (++m_tenSecondTimerTicker == 10) {
            this->beforeRunTimer(10000);
            Annotation::ExpandList<TenSecondTimer>();
            this->afterRunTimer();

            m_tenSecondTimerTicker = 0;
        }

        this->beforeRunTimer(1000);
        Annotation::ExpandList<SecondTimer>();
        this->afterRunTimer();

        // Now iterate through the online players and invoke the per-second per-player invocation
        // list, with the player's Id as the first and only argument.
        this->beforeRunTimer(1005);
        for (new playerId = 0; playerId <= PlayerManager->highestPlayerId(); ++playerId) {
            if (Player(playerId)->isConnected() == false)
                continue;

            Annotation::ExpandList<SecondTimerPerPlayer>(playerId);
        }
        this->afterRunTimer();
    }

    /**
     * The minute-timer is for features that do not operate on a strict time schedule, such as the
     * Tax Agencies and reaction tests. There is no division in timer functionality here, as we can
     * spare a function invocation each minute for features to decide they'd like to punt it.
     */
    public processControlMinuteTimer() {
        this->beforeRunTimer(60 * 1000);
        Annotation::ExpandList<MinuteTimer>();
        this->afterRunTimer();

        // Similar to iterating through all players on a per-second basis, we invoke a second
        // invocation list for each online player, each minute.
        this->beforeRunTimer(60 * 1000 + 5);
        for (new playerId = 0; playerId <= PlayerManager->highestPlayerId(); ++playerId) {
            if (Player(playerId)->isConnected() == false)
                continue;

            Annotation::ExpandList<MinuteTimerPerPlayer>(playerId);
        }
        this->afterRunTimer();
    }

    /**
     * Set up information about the timer which is about to run, and announce that it's going to
     * start executing. This function will be void unless Timer Debugging has been enabled.
     */
    private beforeRunTimer(timerInterval) {
#if Debug::EnableTimerDebugging
        printf("[Timer] Starting iteration of the %d ms timer.", timerInterval);
        m_currentTimerStart = Time->highResolution();
        m_currentTimerInterval = timerInterval;
#else
        #pragma unused timerInterval
#endif
    }

    /**
     * Announce that a timer has successfully ran all its processing in this method. It's a void
     * unless the Timer Debugging feature has been enabled.
     */
    private afterRunTimer() {
#if Debug::EnableTimerDebugging
        printf("[Timer] Iteration of the %d ms timer done. Run-time was %d milliseconds.",
            m_currentTimerInterval, (Time->highResolution() - m_currentTimerStart));
#endif
    }

#if Debug::EnableTimerDebugging

    /**
     * Reset all the timers by re-creating them. It is possible for other parts of the gamemode, or
     * filterscripts, to destroy timer instances they do not control, as the timer system within
     * San Andreas: Multiplayer is shared between Pawn instances.
     */
    public reset() {
        printf("[Timer] Resetting the state of the Timer Controller.");

        KillTimer(m_highResolutionTimer);
        KillTimer(m_secondTimer);
        KillTimer(m_minuteTimer);

        m_highResolutionTimer = SetTimer("OnHighResolutionTimerTick", 250, 1);
        m_secondTimer = SetTimer("OnSecondTimerTick", 1000, 1);
        m_minuteTimer = SetTimer("OnMinuteTimerTick", 60 * 1000 + 500, 1);

        m_twoSecondTimerTicker = 0;
        m_fiveSecondTimerTicker = 0;
        m_tenSecondTimerTicker = 0;
    }

#endif

};
