#!/usr/bin/env node

//////////////////////////////////////////////////////////////////////////
// Copyright 2016 Vuid Pty Ltd
// https://www.vuid.com
//
// This file is part of tredly-cli.
//
// tredly-cli is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// tredly-cli is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with tredly-cli.  If not, see <http://www.gnu.org/licenses/>.
//////////////////////////////////////////////////////////////////////////

// Called from command line
if (require.main === module) {
    require('./lib/cli')
} else {
    // TODO
}