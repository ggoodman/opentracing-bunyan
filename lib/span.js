'use strict';

const Assert = require('assert');
const Opentracing = require('opentracing');

const LogEvent = require('./events/log');
const SpanContext = require('./span_context');
const SpanFinishEvent = require('./events/finish_span');

class Span extends Opentracing.Span {
    constructor(tracer, operationName, spanContext, options) {
        if (!options) options = {};

        Assert(
            tracer instanceof Opentracing.Tracer,
            'tracer must be a Tracer instance'
        );
        Assert(
            typeof operationName === 'string',
            'operationName must be a string'
        );
        Assert(
            spanContext instanceof SpanContext,
            'spanContext must be a SpanContext instance'
        );

        super();

        this._finishedTime = 0;
        this._operationName = operationName;
        this._spanContext = spanContext;
        this._startTime = options.startTime || Date.now();
        this._tags = options.tags || {};
        this._tracerInst = tracer;
    }

    _addTags(tags) {
        for (const key in tags) {
            this._tags[key] = tags[key];
        }

        return this;
    }

    _context() {
        return this._spanContext;
    }

    _finish(timestamp) {
        this._finishedTime = timestamp || Date.now();

        const event = new SpanFinishEvent(this);

        this._tracerInst.events.emit(event.name, event);

        return this;
    }

    _getBaggageItem(key) {
        Assert(typeof key === 'string');

        return this._spanContext.baggageItems[key];
    }

    _log(fields, time) {
        const event = new LogEvent(this, fields, time);

        this._tracerInst.events.emit(event.name, event);

        return this;
    }

    _setBaggageItem(key, value) {
        Assert(typeof key === 'string');

        this._spanContext = this._spanContext.withBaggageItem(key, value);

        return this;
    }

    _setOperationName(operationName) {
        this._operationName = operationName;

        return this;
    }

    _tracer() {
        return this._tracerInst;
    }

    /**
     * Get the operation name
     *
     * @returns {String} operation name
     */
    getOperationName() {
        return this._operationName;
    }
}

module.exports = Span;
