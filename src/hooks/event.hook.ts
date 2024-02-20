import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  AfterCreateHook,
  AfterCreateHookInput,
  AfterRemoveHook,
  AfterRemoveHookInput,
  AfterUpdateHook,
  AfterUpdateHookInput,
  AllDefinitions,
} from 'dryerjs';
import { Context } from 'src/auth/ctx';

@Injectable()
export class EventEmitHook {
  constructor(private eventEmitter: EventEmitter2) {}

  @AfterCreateHook(() => AllDefinitions)
  async fireAfterCreatedEvent(input: AfterCreateHookInput<any, Context>) {
    this.eventEmitter.emit(`${input.definition.name}.created`, input);
  }

  @AfterUpdateHook(() => AllDefinitions)
  async fireAfterUpdatedEvent(input: AfterUpdateHookInput<any, Context>) {
    this.eventEmitter.emit(`${input.definition.name}.updated`, input);
  }

  @AfterRemoveHook(() => AllDefinitions)
  async fireAfterRemovedEvent(input: AfterRemoveHookInput<any, Context>) {
    this.eventEmitter.emit(`${input.definition.name}.removed`, input);
  }
}
