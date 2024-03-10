import { Injectable } from '@nestjs/common';
import { registerEnumType } from '@nestjs/graphql';
import { Agenda } from 'agenda';
import { configuration } from 'src/config';

export enum JobPriority {
  highest = 20,
  high = 10,
  normal = 0,
  low = -10,
  lowest = -20,
}

registerEnumType(JobPriority, {
  name: 'JobPriority',
});

@Injectable()
export class AgendaQueue {
  private agenda: Agenda | null = null;

  constructor() {}

  async getAgenda(): Promise<Agenda> {
    return new Promise((resolve, reject) => {
      if (!this.agenda) {
        this.agenda = new Agenda({
          db: { address: configuration().database.uri },
        });

        this.agenda.on('ready', () => resolve(this.agenda));
        this.agenda.on('error', (err) => reject(err));
      } else {
        resolve(this.agenda);
      }
    });
  }
}
