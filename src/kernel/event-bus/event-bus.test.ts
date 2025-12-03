/**
 * EventBus Tests - Kernel Layer
 *
 * TDD tests based on design-docs/04-kernel-layer-spec.md
 * These tests define the expected behavior BEFORE implementation.
 *
 * Run: pnpm test src/kernel/event-bus/event-bus.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { EventBus } from './types'

import { createEventBus } from './event-bus'

describe('EventBus', () => {
  let bus: EventBus

  beforeEach(() => {
    bus = createEventBus()
  })

  describe('publish/subscribe', () => {
    it('should deliver payload to subscriber when event is published', () => {
      const spy = vi.fn()
      bus.subscribe('test.event', spy)

      bus.publish('test.event', { data: 123 })

      expect(spy).toHaveBeenCalledOnce()
      expect(spy).toHaveBeenCalledWith({ data: 123 })
    })

    it('should deliver to multiple subscribers for same event', () => {
      const spy1 = vi.fn()
      const spy2 = vi.fn()
      bus.subscribe('multi.event', spy1)
      bus.subscribe('multi.event', spy2)

      bus.publish('multi.event', { value: 'test' })

      expect(spy1).toHaveBeenCalledWith({ value: 'test' })
      expect(spy2).toHaveBeenCalledWith({ value: 'test' })
    })

    it('should not call subscriber for different event', () => {
      const spy = vi.fn()
      bus.subscribe('event.a', spy)

      bus.publish('event.b', {})

      expect(spy).not.toHaveBeenCalled()
    })

    it('should handle publish with no payload', () => {
      const spy = vi.fn()
      bus.subscribe('no.payload', spy)

      bus.publish('no.payload')

      expect(spy).toHaveBeenCalledOnce()
      expect(spy).toHaveBeenCalledWith(undefined)
    })

    it('should handle publish with no subscribers gracefully', () => {
      // Should not throw
      expect(() => bus.publish('orphan.event', { data: 1 })).not.toThrow()
    })
  })

  describe('unsubscribe', () => {
    it('should stop receiving events after unsubscribe', () => {
      const spy = vi.fn()
      const unsubscribe = bus.subscribe('unsub.test', spy)

      bus.publish('unsub.test', { call: 1 })
      expect(spy).toHaveBeenCalledTimes(1)

      unsubscribe()
      bus.publish('unsub.test', { call: 2 })
      expect(spy).toHaveBeenCalledTimes(1) // Still 1, not called again
    })

    it('should allow multiple unsubscribe calls without error', () => {
      const spy = vi.fn()
      const unsubscribe = bus.subscribe('multi.unsub', spy)

      unsubscribe()
      expect(() => unsubscribe()).not.toThrow()
    })

    it('should not affect other subscribers when one unsubscribes', () => {
      const spy1 = vi.fn()
      const spy2 = vi.fn()
      const unsub1 = bus.subscribe('partial.unsub', spy1)
      bus.subscribe('partial.unsub', spy2)

      unsub1()
      bus.publish('partial.unsub', {})

      expect(spy1).not.toHaveBeenCalled()
      expect(spy2).toHaveBeenCalledOnce()
    })
  })

  describe('subscribeOnce', () => {
    it('should only call subscriber once then auto-unsubscribe', () => {
      const spy = vi.fn()
      bus.subscribeOnce('once.event', spy)

      bus.publish('once.event', { first: true })
      bus.publish('once.event', { second: true })

      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith({ first: true })
    })

    it('should return unsubscribe function that works before event fires', () => {
      const spy = vi.fn()
      const unsubscribe = bus.subscribeOnce('once.cancel', spy)

      unsubscribe()
      bus.publish('once.cancel', {})

      expect(spy).not.toHaveBeenCalled()
    })
  })

  describe('channels (app isolation)', () => {
    it('should create isolated channel with namespace', () => {
      const channel = bus.createChannel('app.finder')

      expect(channel).toBeDefined()
      expect(channel.publish).toBeTypeOf('function')
      expect(channel.subscribe).toBeTypeOf('function')
      expect(channel.destroy).toBeTypeOf('function')
    })

    it('should isolate events between different channels', () => {
      const channel1 = bus.createChannel('app1')
      const channel2 = bus.createChannel('app2')
      const spy1 = vi.fn()
      const spy2 = vi.fn()

      channel1.subscribe('msg', spy1)
      channel2.subscribe('msg', spy2)

      channel1.publish('msg', { from: 'app1' })

      expect(spy1).toHaveBeenCalledWith({ from: 'app1' })
      expect(spy2).not.toHaveBeenCalled()
    })

    it('should isolate channel events from global bus', () => {
      const channel = bus.createChannel('isolated')
      const channelSpy = vi.fn()
      const globalSpy = vi.fn()

      channel.subscribe('test', channelSpy)
      bus.subscribe('test', globalSpy)

      channel.publish('test', { scope: 'channel' })

      expect(channelSpy).toHaveBeenCalled()
      expect(globalSpy).not.toHaveBeenCalled()
    })

    it('should unsubscribe all channel listeners on destroy', () => {
      const channel = bus.createChannel('destroyable')
      const spy1 = vi.fn()
      const spy2 = vi.fn()

      channel.subscribe('event1', spy1)
      channel.subscribe('event2', spy2)

      channel.destroy()

      channel.publish('event1', {})
      channel.publish('event2', {})

      expect(spy1).not.toHaveBeenCalled()
      expect(spy2).not.toHaveBeenCalled()
    })

    it('should allow safe operations on destroyed channel', () => {
      const channel = bus.createChannel('safe.destroy')
      channel.destroy()

      // These should not throw
      expect(() => channel.publish('test', {})).not.toThrow()
      expect(() => channel.subscribe('test', vi.fn())).not.toThrow()
      expect(() => channel.destroy()).not.toThrow()
    })
  })

  describe('type safety (compile-time)', () => {
    it('should accept typed payloads', () => {
      interface MyPayload {
        userId: string
        action: 'login' | 'logout'
      }

      const spy = vi.fn<[MyPayload], void>()
      bus.subscribe<MyPayload>('user.action', spy)
      bus.publish<MyPayload>('user.action', { userId: '123', action: 'login' })

      expect(spy).toHaveBeenCalledWith({ userId: '123', action: 'login' })
    })
  })
})

describe('EventBus - System Events', () => {
  let bus: EventBus

  beforeEach(() => {
    bus = createEventBus()
  })

  it('should handle system.boot event', () => {
    const spy = vi.fn()
    bus.subscribe('system.boot', spy)

    bus.publish('system.boot', {})

    expect(spy).toHaveBeenCalledWith({})
  })

  it('should handle app.launched event with correct payload', () => {
    const spy = vi.fn()
    bus.subscribe('app.launched', spy)

    bus.publish('app.launched', { appId: 'finder', taskId: 'task-123' })

    expect(spy).toHaveBeenCalledWith({ appId: 'finder', taskId: 'task-123' })
  })

  it('should handle window.focused event', () => {
    const spy = vi.fn()
    bus.subscribe('window.focused', spy)

    bus.publish('window.focused', { windowId: 'win-456' })

    expect(spy).toHaveBeenCalledWith({ windowId: 'win-456' })
  })
})

