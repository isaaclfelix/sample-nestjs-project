import { Module, type DynamicModule } from '@nestjs/common';
import {
  ARCHIPIELAGO_NEST_OPTIONS,
  type ArchipielagoNestOptions,
} from './archipielago-nest.options.js';
import { ArchipielagoViewService } from './archipielago-view.service.js';

@Module({})
export class ArchipielagoModule {
  /**
   * Registers the Archipielago renderer for a Nest application.
   *
   * The host supplies app-owned page stylesheet policy while the package owns
   * renderer construction and exports it for controllers or wrappers.
   *
   * @param {ArchipielagoNestOptions} options - Host-specific renderer options.
   * @returns {DynamicModule} Nest module exporting the view service.
   */
  static forRoot(options: ArchipielagoNestOptions = {}): DynamicModule {
    return {
      module: ArchipielagoModule,
      providers: [
        { provide: ARCHIPIELAGO_NEST_OPTIONS, useValue: options },
        ArchipielagoViewService,
      ],
      exports: [ArchipielagoViewService],
    };
  }
}
