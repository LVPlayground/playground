// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

/**
 * How many queries should the Query Builder be able to support? The queries will take just over a
 * kilobyte of data to store, each, so while it's irrelevant on the large scale of things, please
 * please try to keep this as low as possible.
 */
#define QueryBuilderInstanceCount 16

/**
 * The Query Builder may be used to safely prepare an array for usage later on in the gamemode,
 * after which the relevant arguments can be applied using the apply() function. The given arguments
 * will automatically be filtered for unsafe values, ensuring proper data-types and functionality.
 *
 * Queries can be registered once, but may not be removed anymore after they've been made available.
 * For queries which' structure can change during gamemode execution, you shouldn't be using this.
 *
 * Queries curated by the Query Builder can be, after parameter substitution, 1023 characters in
 * length at most. They can have up to thirty two (32) parameters, which start with a percentage
 * sign followed by a number between 0 and 31 (i.e. %0 to %31). The types of these parameters have
 * to be defined at the time the Query Builder is created, and can be "i" for integers, "f" for
 * floats and "s" for strings.
 *
 * Sample usage of this class is as follows:
 *
 * {{{
 * new query[128], queryId;
 * if (QueryBuilder->create("SELECT user_id FROM users WHERE nickname = %0", "s", queryId) == false)
 *     // An error occurred while creating the Query Builder.
 *
 * QueryBuilder(queryId)->apply(query, sizeof(query), nickname);
 * }}}
 *
 * The created query, with the "nickname" string applied and properly filtered for safe transmission
 * to the database, will now be stored to within the "query" variable for further usage.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class QueryBuilder <queryId (QueryBuilderInstanceCount)> {
    // What is the maximum length, in characters (including the NULL character), of a query?
    const MaximumQueryLength = 1024;

    // The query string as will be used by this query, unformatted.
    new m_queryString[MaximumQueryLength];

    // How many parameters have been used in the query?
    new m_parameters[33];

    // How many queries are currently being curated by the Query Builder?
    new static m_queryCount = 0;

    /**
     * Prepare a new instance of the Query Builder with the settings as given through the arguments.
     * The new instance is final, and the query and parameters will no longer be able to change. All
     * input parameters will be checked thoroughly for their validity.
     *
     * @param query The query which should be stored and made ready for apply().
     * @param parameters The parameter types as they will be passed to the apply function.
     * @param queryId Id of the Query Builder that has been created, passed by reference.
     * @return boolean Has the Query Builder successfully been created?
     */
    public static bool: create(query[], parameters[], &queryId) {
        if (m_queryCount >= QueryBuilderInstanceCount) {
            printf("[QueryBuilder] The maximum number (%d) of Query Builders has already been created.", QueryBuilderInstanceCount);
            return false;
        }

        queryId = ++m_queryCount;
        QueryBuilder(queryId)->initialize(query, parameters);

        return true;
    }

    /**
     * Since the create() method is static, it will delegate actually instantiating the query
     * builder to this method, which will set the right values. If an invalid parameter type has
     * been detected in the formatting definition, it will fall back to being an integer.
     *
     * @param query The query which should be stored and made ready for apply().
     * @param parameters The parameter types as they will be passed to the apply function.
     */
    private initialize(query[], parameters[]) {
        format(m_queryString, MaximumQueryLength, "%s", query);
        for (new index = 0, length = strlen(parameters); index < length; ++index) {
            if (parameters[index] != 'i' && parameters[index] != 'f' && parameters[index] != 's') {
                printf("[QueryBuilder] Invalid parameter type '%s' supplied for query %d.", queryId);
                parameters[index] = 'i';
            }

            m_parameters[index] = parameters[index];
        }
    }

    /**
     * Safely apply the given input variables to the query as it has been formatted earlier on. This
     * function will iterate through the query, append any substitutions it finds on the fly and
     * writes the output to the buffer string as passed to this query. A basic amount of error
     * checking will be done, as performance of this function is quite important.
     *
     * Note here is that the PreCompiler inserts a hidden argument, so we have to substract one more
     * from numargs() to get the actual number of variable arguments passed.
     *
     * @param buffer The buffer which the result of this query should be stored in.
     * @param bufferSize Maximum size in number of cells of the buffer.
     * @return integer Length of the generated query.
     */
    public apply(buffer[], bufferSize, {Float,_}:...) {
        if ((numargs() - 3) != strlen(m_parameters)) {
            printf("Error (QueryBuilder<%d>::apply): Unexpected argument count. Expected %d, got %d.", queryId, strlen(m_parameters), numargs() - 3);
            buffer[0] = 0; // Make sure that the buffer is empty.
            return 0;
        }

        new generatedQuery[MaximumQueryLength],
            generatedQueryIndex = 0,
            parameterCount = strlen(m_parameters),
            parameterIndex = 0,
            parsingBuffer[8];

        for (new index = 0, length = strlen(m_queryString); index < length; ++index) {
            if (generatedQueryIndex >= MaximumQueryLength)
                break;

            if (m_queryString[index] != '%') {
                generatedQuery[generatedQueryIndex++] = m_queryString[index];
                continue;
            }

            if (m_queryString[index + 1] < '0' || m_queryString[index + 1] > '9')
                continue;

            parameterIndex = m_queryString[++index] - '0';
            if (m_queryString[index + 1] >= '0' && m_queryString[index + 1] <= '9')
                parameterIndex = (10 * parameterIndex) + (m_queryString[++index] - '0');

            if (parameterIndex >= parameterCount)
                continue;

            switch(m_parameters[parameterIndex]) {
                case 'i': {
                    new integerParameter = getarg(3 + parameterIndex);
                    valstr(parsingBuffer, integerParameter, false);
                    strins(generatedQuery, parsingBuffer, generatedQueryIndex, MaximumQueryLength);
                    generatedQueryIndex += strlen(parsingBuffer);
                }

                case 'f': {
                    new Float: floatParameter = Float: getarg(3 + parameterIndex);
                    format(parsingBuffer, sizeof(parsingBuffer), "%.4f", floatParameter);
                    strins(generatedQuery, parsingBuffer, generatedQueryIndex, MaximumQueryLength);
                    generatedQueryIndex += strlen(parsingBuffer);
                }

                case 's': {
                    new currentCharacter = 0, characterIndex = 0;
                    generatedQuery[generatedQueryIndex++] = 34; // "
                    do {
                        currentCharacter = getarg(3 + parameterIndex, characterIndex++);
                        if (currentCharacter == 0)
                            break;

                        if (currentCharacter == 92 /* \ */ || currentCharacter == 34 /* " */)
                            generatedQuery[generatedQueryIndex++] = 92; // \ 

                        generatedQuery[generatedQueryIndex++] = currentCharacter;
                    } while (generatedQueryIndex < bufferSize);

                    generatedQuery[generatedQueryIndex++] = 34; // "
                }

                default: {
                    printf("[QueryBuilder] Error: Invalid formatting parameter supplied: \"%c\".", m_parameters[parameterIndex]);
                    printf("[QueryBuilder] Query: %s", m_queryString);
                }
            }
        }

        generatedQuery[generatedQueryIndex] = 0;
        format(buffer, bufferSize, "%s", generatedQuery);

        return generatedQueryIndex;
    }
};
