/********************************************************************************
 * Copyright (C) 2017 TypeFox and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/

import { ContainerModule, Container } from 'inversify';
import { CommandContribution, MenuContribution } from '@theia/core/lib/common';
import { KeybindingContribution, WidgetFactory, KeybindingContext } from '@theia/core/lib/browser';
import { TabBarToolbarContribution } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { TerminalFrontendContribution } from './terminal-frontend-contribution';
import { TerminalWidgetImpl, TERMINAL_WIDGET_FACTORY_ID } from './terminal-widget-impl';
import { TerminalWidget, TerminalWidgetOptions } from '@theia/terminal/lib/browser/terminal-widget';
import { TerminalActiveContext } from './terminal-keybinding-contexts';
import { TerminalService } from '@theia/terminal/lib/browser/terminal-service';
import { bindTerminalPreferences } from './terminal-preferences';

import '../../src/browser/terminal.css';
import 'xterm/lib/xterm.css';

export default new ContainerModule(bind => {
    bindTerminalPreferences(bind);
    bind(KeybindingContext).to(TerminalActiveContext).inSingletonScope();

    bind(TerminalWidget).to(TerminalWidgetImpl).inTransientScope();

    let terminalNum = 0;
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: TERMINAL_WIDGET_FACTORY_ID,
        createWidget: (options: TerminalWidgetOptions) => {
            const child = new Container({ defaultScope: 'Singleton' });
            child.parent = ctx.container;
            const counter = terminalNum++;
            const domId = options.id || 'terminal-' + counter;
            const widgetOptions: TerminalWidgetOptions = {
                title: 'Terminal ' + counter,
                useServerTitle: true,
                destroyTermOnClose: true,
                ...options
            };
            child.bind(TerminalWidgetOptions).toConstantValue(widgetOptions);
            child.bind('terminal-dom-id').toConstantValue(domId);

            return child.get(TerminalWidget);
        }
    }));

    // todo move it back to the @theia/terminal
    bind(TerminalFrontendContribution).toSelf().inSingletonScope();
    bind(TerminalService).toService(TerminalFrontendContribution);
    for (const identifier of [CommandContribution, MenuContribution, KeybindingContribution, TabBarToolbarContribution]) {
        bind(identifier).toService(TerminalFrontendContribution);
    }
});