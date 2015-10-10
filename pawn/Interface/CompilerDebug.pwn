// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

/**
 * The Las Venturas Playground PreCompiler supports quite a lot of features, some which make your
 * life as a developer considerably easier. This can, however, result in a lot of magic being done
 * for you, the effects of which may not be immediately obvious. In order to compensate for this,
 * the PreCompiler offers a number of debugging options, some of which need support functions in
 * Pawn to actually output, process or analyze the available information.
 *
 * The available debug options are as follows:
 *
 * #compiler debug(InvocationListCalls)
 *
 *     Call the beforeListExecution(l) method prior to executing any method in an invocation list,
 *     then the beforeMethodCall(name[]) method before invoking anything, then afterMethodCall()
 *     when a method has been invoked and finally afterListExecution() to announce that it's done.
 *
 * #compiler debug(InvocationSwitchCalls)
 *
 *     Call the beforeSwitchExecution(s) method before executing any method in an invocation switch
 *     followed by the beforeMethodCall(name[]) method, and finally the afterMethodCall() method
 *     after it's done. Switch lists exit after this, so there is no switch-final callback.
 *
 * #compiler debug(PublicFunctionCalls)
 *
 *     Track down execution of public functions by invoking the beforePublicFunction(name[]) method
 *     before execution, and the afterPublicFunction() method after it has finished.
 *
 * #compiler debug(PawnCompiler)
 *
 *     Enable the internal debugging mode in the Pawn compiler. This will disable all optimization
 *     for the script, add function labels and allows the "crashdetect" plugin to be used.
 *
 * More debugging features may be added in the future, each of which will be documented here. How
 * they aid in your debugging will be impacted by the implementations of each of these methods.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class CompilerDebug {
    // What is the name of the method that's currently being executed?
    new m_currentMethod[128];

    // Tick-count for the time at which the current method started executing.
    new m_invocationStart;

    // What is the name of the public function that's currently being executed?
    new m_currentPublicFunction[128];

    // Tick-count for when the public method invocation has started.
    new m_publicInvocationStart;

    /**
     * Before the methods in an invocation list are being executed, they will be announced through
     * this callback with the list's name and all parameters which will be passed to the list. You
     * may want to analyze and write out the parameters as well.
     *
     * @param name Name of the list that is about to be executed.
     * @param ... The parameters, as passed on to the invocation list.
     */
    public beforeListExecution(name[], ...) {
        printf("[CompilerDebug] Starting invocation list \"%s\".", name);
    }

    /**
     * Similar to beforeListExecution() being invoked before an invocation list, this method does
     * the same prior to executing an invocation switch method and includes the name and parameters.
     *
     * @param name Name of the switch that is about to be executed.
     * @param ... The parameters, as passed on to the invocation switch.
     */
    public beforeSwitchExecution(name[], ...) {
        printf("[CompilerDebug] Starting invocation switch \"%s\".", name);
    }

    /**
     * Prior to invoking a method in an invocation {list, switch}, this method will be called with
     * the to-be-invoked method's name. This would be the place to set up benchmarking.
     *
     * @param name Name of the method (Class::Method) that will be executed.
     */
    public beforeMethodCall(name[]) {
        format(m_currentMethod, sizeof(m_currentMethod), "%s", name);
        printf("[CompilerDebug] Invoking method \"%s\".", name);
        m_invocationStart = Time->highResolution();
    }

    /**
     * This method will be invoked to announce that a certain method in an invocation {list, switch}
     * has finished execution. This will be useful in tracking down crashes.
     */
    public afterMethodCall() {
        printf("[CompilerDebug] Done executing \"%s\" in %d ms.", m_currentMethod, Time->highResolution() - m_invocationStart);
    }

    /**
     * After an invocation list has finished executing all methods within the list, this method will
     * be invoked to announce that.
     */
    public afterListExecution() {
        printf("[CompilerDebug] Finished executing the invocation list.");
    }

    /**
     * This method will be invoked prior to the execution of any public function. Since it's hard
     * to pass arrays as arguments within the compiler, each passed argument is one of the letters.
     *
     * @param ... Name of the function the function that's being executed.
     */
    public beforePublicFunction(...) {
        for (new index = 0, length = numargs(); index < length; ++index)
            m_currentPublicFunction[index] = getarg(index);
        m_currentPublicFunction[numargs()] = 0;

        printf("[CompilerDebug] Invoking public function \"%s\".", m_currentPublicFunction);
        m_publicInvocationStart = Time->highResolution();
    }

    /**
     * Announce that invoking a public method has finished by invoking this method. Calculating the
     * total run-time may be done in here, and we can be sure that it didn't crash.
     */
    public afterPublicFunction() {
        printf("[CompilerDebug] Finished executing \"%s\" in %d ms.", m_currentPublicFunction, Time->highResolution() - m_publicInvocationStart);
    }
};
