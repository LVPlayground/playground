// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// The parameters given to a conversational query. This enables the responses to be richer by adding
// data about timezone, location, and context about the query that's being ran.
//
// https://cloud.google.com/dialogflow/docs/reference/rest/v2beta1/QueryParameters
export class QueryParameters {
    timeZone = null;
    geoLocation = null;
    contexts = null;
    resetContexts = null;
    sessionEntityTypes = null;
    payload = null;
    knowledgeBaseNames = null;
    sentimentAnalysisRequestConfig = null;
    subAgents = null;
    webhookHeaders = null;

    // Builds the QueryParameters object that's to be included in the request. All fields are
    // optional, and only defined fields will be included in the structure.
    buildObject() {
        const object = {};

        if (typeof this.timeZone === 'string')
            object.timeZone = this.timeZone;
        if (typeof this.geoLocation === 'object')
            object.geoLocation = this.geoLocation;
        if (typeof this.contexts === 'object')
            object.contexts = this.contexts;
        if (typeof this.resetContexts === 'boolean')
            object.resetContexts = this.resetContexts;
        if (Array.isArray(this.sessionEntityTypes))
            object.sessionEntityTypes = this.sessionEntityTypes;
        if (typeof this.payload === 'object')
            object.payload = this.payload;
        if (Array.isArray(this.knowledgeBaseNames))
            object.knowledgeBaseNames = this.knowledgeBaseNames;
        if (typeof this.sentimentAnalysisRequestConfig === 'object')
            object.sentimentAnalysisRequestConfig = this.sentimentAnalysisRequestConfig;
        if (Array.isArray(this.subAgents))
            object.subAgents = this.subAgents;
        if (typeof this.webhookHeaders === 'object')
            object.webhookHeaders = this.webhookHeaders;

        return Object.getOwnPropertyNames(object).length ? object : null;
    }
}
