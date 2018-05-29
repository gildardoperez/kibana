/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import expect from 'expect.js';
import { escapeQuotes, escapeKuery } from '../escape_kuery';

describe('Kuery escape', function () {
  it('should escape quotes', function () {
    const value = 'I said, "Hello."';
    const expected = 'I said, \\"Hello.\\"';
    expect(escapeQuotes(value)).to.be(expected);
  });

  it('should escape special characters', function () {
    const value = `This \\ has (a lot of) <special> characters, don't you *think*? "Yes."`;
    const expected = `This \\\\ has \\(a lot of\\) \\<special\\> characters, don't you \\*think\\*? \\"Yes.\\"`;
    expect(escapeKuery(value)).to.be(expected);
  });

  it('should escape keywords', function () {
    const value = 'foo and bar or baz not qux';
    const expected = 'foo \\and bar \\or baz \\not qux';
    expect(escapeKuery(value)).to.be(expected);
  });

  it('should escape keywords next to each other', function () {
    const value = 'foo and bar or not baz';
    const expected = 'foo \\and bar \\or \\not baz';
    expect(escapeKuery(value)).to.be(expected);
  });

  it('should not escape keywords without surrounding spaces', function () {
    const value = 'And this has keywords, or does it not?';
    const expected = 'And this has keywords, \\or does it not?';
    expect(escapeKuery(value)).to.be(expected);
  });

  it('should escape uppercase keywords', function () {
    const value = 'foo AND bar';
    const expected = 'foo \\AND bar';
    expect(escapeKuery(value)).to.be(expected);
  });

  it('should escape both keywords and special characters', function () {
    const value = 'Hello, world, and <nice> to meet you!';
    const expected = 'Hello, world, \\and \\<nice\\> to meet you!';
    expect(escapeKuery(value)).to.be(expected);
  });
});
