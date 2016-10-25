/*[global-shim-start]*/
(function (exports, global){
	var origDefine = global.define;

	var get = function(name){
		var parts = name.split("."),
			cur = global,
			i;
		for(i = 0 ; i < parts.length; i++){
			if(!cur) {
				break;
			}
			cur = cur[parts[i]];
		}
		return cur;
	};
	var modules = (global.define && global.define.modules) ||
		(global._define && global._define.modules) || {};
	var ourDefine = global.define = function(moduleName, deps, callback){
		var module;
		if(typeof deps === "function") {
			callback = deps;
			deps = [];
		}
		var args = [],
			i;
		for(i =0; i < deps.length; i++) {
			args.push( exports[deps[i]] ? get(exports[deps[i]]) : ( modules[deps[i]] || get(deps[i]) )  );
		}
		// CJS has no dependencies but 3 callback arguments
		if(!deps.length && callback.length) {
			module = { exports: {} };
			var require = function(name) {
				return exports[name] ? get(exports[name]) : modules[name];
			};
			args.push(require, module.exports, module);
		}
		// Babel uses the exports and module object.
		else if(!args[0] && deps[0] === "exports") {
			module = { exports: {} };
			args[0] = module.exports;
			if(deps[1] === "module") {
				args[1] = module;
			}
		} else if(!args[0] && deps[0] === "module") {
			args[0] = { id: moduleName };
		}

		global.define = origDefine;
		var result = callback ? callback.apply(null, args) : undefined;
		global.define = ourDefine;

		// Favor CJS module.exports over the return value
		modules[moduleName] = module && module.exports ? module.exports : result;
	};
	global.define.orig = origDefine;
	global.define.modules = modules;
	global.define.amd = true;
	ourDefine("@loader", [], function(){
		// shim for @@global-helpers
		var noop = function(){};
		return {
			get: function(){
				return { prepareGlobal: noop, retrieveGlobal: noop };
			},
			global: global,
			__exec: function(__load){
				eval("(function() { " + __load.source + " \n }).call(global);");
			}
		};
	});
})({},window)
/*can@2.3.18#can*/
define('can/can', function (require, exports, module) {
    var can = require('can/util/util');
    require('can/map/define/define');
    require('can/view/stache/stache');
    require('can/component/component');
    require('can/route/route');
    module.exports = can;
});
/*can@2.3.18#component/component_bindings_test.js*/
define('can/component/component_bindings_test.js', function (require, exports, module) {
    var can = require('can/can');
    require('can/map/define/define');
    require('can/component/component');
    require('can/view/stache/stache');
    require('can/route/route');
    require('steal-qunit');
    var innerHTML = function (node) {
        if ('innerHTML' in node) {
            return node.innerHTML;
        }
    };
    function makeTest(name, doc) {
        var oldDoc;
        QUnit.module(name, {
            setup: function () {
                oldDoc = can.document;
                can.document = doc;
                if (doc) {
                    this.fixture = doc.createElement('div');
                    doc.body.appendChild(this.fixture);
                    this.$fixture = can.$(this.fixture);
                } else {
                    this.fixture = can.$('#qunit-fixture')[0];
                    this.$fixture = can.$('#qunit-fixture');
                }
            },
            teardown: function () {
                can.document = oldDoc;
                if (doc) {
                    doc.body.removeChild(this.fixture);
                }
            }
        });
        var Paginate = can.Map.extend({
            count: Infinity,
            offset: 0,
            limit: 100,
            setCount: function (newCount, success, error) {
                return newCount < 0 ? 0 : newCount;
            },
            setOffset: function (newOffset) {
                return newOffset < 0 ? 0 : Math.min(newOffset, !isNaN(this.count - 1) ? this.count - 1 : Infinity);
            },
            next: function () {
                this.attr('offset', this.offset + this.limit);
            },
            prev: function () {
                this.attr('offset', this.offset - this.limit);
            },
            canNext: function () {
                return this.attr('offset') < this.attr('count') - this.attr('limit');
            },
            canPrev: function () {
                return this.attr('offset') > 0;
            },
            page: function (newVal) {
                if (newVal === undefined) {
                    return Math.floor(this.attr('offset') / this.attr('limit')) + 1;
                } else {
                    this.attr('offset', (parseInt(newVal) - 1) * this.attr('limit'));
                }
            },
            pageCount: function () {
                return this.attr('count') ? Math.ceil(this.attr('count') / this.attr('limit')) : null;
            }
        });
        test('basic tabs', function () {
            can.Component.extend({
                tag: 'tabs',
                template: can.stache('<ul>' + '{{#panels}}' + '<li {{#isActive}}class=\'active\'{{/isActive}} can-click=\'makeActive\'>{{title}}</li>' + '{{/panels}}' + '</ul>' + '<content></content>'),
                viewModel: {
                    panels: [],
                    addPanel: function (panel) {
                        if (this.attr('panels').length === 0) {
                            this.makeActive(panel);
                        }
                        this.attr('panels').push(panel);
                    },
                    removePanel: function (panel) {
                        var panels = this.attr('panels');
                        can.batch.start();
                        panels.splice(panels.indexOf(panel), 1);
                        if (panel === this.attr('active')) {
                            if (panels.length) {
                                this.makeActive(panels[0]);
                            } else {
                                this.removeAttr('active');
                            }
                        }
                        can.batch.stop();
                    },
                    makeActive: function (panel) {
                        this.attr('active', panel);
                        this.attr('panels').each(function (panel) {
                            panel.attr('active', false);
                        });
                        panel.attr('active', true);
                    },
                    isActive: function (panel) {
                        return this.attr('active') === panel;
                    }
                }
            });
            can.Component.extend({
                template: can.stache('{{#if active}}<content></content>{{/if}}'),
                tag: 'panel',
                viewModel: {
                    active: false,
                    title: '@'
                },
                events: {
                    ' inserted': function () {
                        can.viewModel(this.element[0].parentNode).addPanel(this.viewModel);
                    },
                    ' removed': function () {
                        if (!can.viewModel(this.element[0].parentNode)) {
                            console.log('bruke');
                        }
                        can.viewModel(this.element[0].parentNode).removePanel(this.viewModel);
                    }
                }
            });
            var template = can.stache('<tabs>{{#each foodTypes}}<panel title=\'{{title}}\'>{{content}}</panel>{{/each}}</tabs>');
            var foodTypes = new can.List([
                {
                    title: 'Fruits',
                    content: 'oranges, apples'
                },
                {
                    title: 'Breads',
                    content: 'pasta, cereal'
                },
                {
                    title: 'Sweets',
                    content: 'ice cream, candy'
                }
            ]);
            var frag = template({ foodTypes: foodTypes });
            can.append(this.$fixture, frag);
            var testArea = this.fixture, lis = testArea.getElementsByTagName('li');
            equal(lis.length, 3, 'three lis added');
            foodTypes.each(function (type, i) {
                equal(innerHTML(lis[i]), type.attr('title'), 'li ' + i + ' has the right content');
            });
            foodTypes.push({
                title: 'Vegies',
                content: 'carrots, kale'
            });
            lis = testArea.getElementsByTagName('li');
            equal(lis.length, 4, 'li added');
            foodTypes.each(function (type, i) {
                equal(innerHTML(lis[i]), type.attr('title'), 'li ' + i + ' has the right content');
            });
            equal(testArea.getElementsByTagName('panel').length, 4, 'panel added');
            foodTypes.shift();
            lis = testArea.getElementsByTagName('li');
            equal(lis.length, 3, 'removed li after shifting a foodType');
            foodTypes.each(function (type, i) {
                equal(innerHTML(lis[i]), type.attr('title'), 'li ' + i + ' has the right content');
            });
            var panels = testArea.getElementsByTagName('panel');
            equal(lis[0].className, 'active', 'the first element is active');
            equal(innerHTML(panels[0]), 'pasta, cereal', 'the first content is shown');
            equal(innerHTML(panels[1]), '', 'the second content is removed');
            can.trigger(lis[1], 'click');
            lis = testArea.getElementsByTagName('li');
            equal(lis[1].className, 'active', 'the second element is active');
            equal(lis[0].className, '', 'the first element is not active');
            equal(innerHTML(panels[0]), '', 'the second content is removed');
            equal(innerHTML(panels[1]), 'ice cream, candy', 'the second content is shown');
        });
        test('lexical scoping', function () {
            can.Component.extend({
                tag: 'hello-world',
                leakScope: false,
                template: can.stache('{{greeting}} <content>World</content>{{exclamation}}'),
                viewModel: { greeting: 'Hello' }
            });
            var template = can.stache('<hello-world>{{greeting}}</hello-world>');
            var frag = template({
                greeting: 'World',
                exclamation: '!'
            });
            var hello = frag.firstChild;
            equal(can.trim(innerHTML(hello)), 'Hello World');
            can.Component.extend({
                tag: 'hello-world-no-template',
                leakScope: false,
                viewModel: { greeting: 'Hello' }
            });
            template = can.stache('<hello-world-no-template>{{greeting}}</hello-world-no-template>');
            frag = template({
                greeting: 'World',
                exclamation: '!'
            });
            hello = frag.firstChild;
            equal(can.trim(innerHTML(hello)), 'Hello', 'If no template is provided to can.Component, treat <content> bindings as dynamic.');
        });
        test('dynamic scoping', function () {
            can.Component.extend({
                tag: 'hello-world',
                leakScope: true,
                template: can.stache('{{greeting}} <content>World</content>{{exclamation}}'),
                viewModel: { greeting: 'Hello' }
            });
            var template = can.stache('<hello-world>{{greeting}}</hello-world>');
            var frag = template({
                greeting: 'World',
                exclamation: '!'
            });
            var hello = frag.firstChild;
            equal(can.trim(innerHTML(hello)), 'Hello Hello!');
        });
        test('treecombo', function () {
            can.Component.extend({
                tag: 'treecombo',
                template: can.stache('<ul class=\'breadcrumb\'>' + '<li can-click=\'emptyBreadcrumb\'>{{title}}</li>' + '{{#each breadcrumb}}' + '<li can-click=\'updateBreadcrumb\'>{{title}}</li>' + '{{/each}}' + '</ul>' + '<ul class=\'options\'>' + '<content>' + '{{#selectableItems}}' + '<li {{#isSelected}}class=\'active\'{{/isSelected}} can-click=\'toggle\'>' + '<input type=\'checkbox\' {{#isSelected}}checked{{/isSelected}}/>' + '{{title}}' + '{{#if children.length}}' + '<button class=\'showChildren\' can-click=\'showChildren\'>+</button>' + '{{/if}}' + '</li>' + '{{/selectableItems}}' + '</content>' + '</ul>'),
                viewModel: {
                    items: [],
                    breadcrumb: [],
                    selected: [],
                    selectableItems: function () {
                        var breadcrumb = this.attr('breadcrumb');
                        if (breadcrumb.attr('length')) {
                            return breadcrumb.attr('' + (breadcrumb.length - 1) + '.children');
                        } else {
                            return this.attr('items');
                        }
                    },
                    showChildren: function (item, el, ev) {
                        ev.stopPropagation();
                        this.attr('breadcrumb').push(item);
                    },
                    emptyBreadcrumb: function () {
                        this.attr('breadcrumb').attr([], true);
                    },
                    updateBreadcrumb: function (item) {
                        var breadcrumb = this.attr('breadcrumb'), index = breadcrumb.indexOf(item);
                        breadcrumb.splice(index + 1, breadcrumb.length - index - 1);
                    },
                    toggle: function (item) {
                        var selected = this.attr('selected'), index = selected.indexOf(item);
                        if (index === -1) {
                            selected.push(item);
                        } else {
                            selected.splice(index, 1);
                        }
                    }
                },
                helpers: {
                    isSelected: function (options) {
                        if (this.attr('selected').indexOf(options.context) > -1) {
                            return options.fn();
                        } else {
                            return options.inverse();
                        }
                    }
                }
            });
            var template = can.stache('<treecombo {(items)}=\'locations\' title=\'Locations\'></treecombo>');
            var base = new can.Map({});
            var frag = template(base);
            var root = doc.createElement('div');
            root.appendChild(frag);
            var items = [
                {
                    id: 1,
                    title: 'Midwest',
                    children: [
                        {
                            id: 5,
                            title: 'Illinois',
                            children: [
                                {
                                    id: 23423,
                                    title: 'Chicago'
                                },
                                {
                                    id: 4563,
                                    title: 'Springfield'
                                },
                                {
                                    id: 4564,
                                    title: 'Naperville'
                                }
                            ]
                        },
                        {
                            id: 6,
                            title: 'Wisconsin',
                            children: [
                                {
                                    id: 232423,
                                    title: 'Milwaulkee'
                                },
                                {
                                    id: 45463,
                                    title: 'Green Bay'
                                },
                                {
                                    id: 45464,
                                    title: 'Madison'
                                }
                            ]
                        }
                    ]
                },
                {
                    id: 2,
                    title: 'East Coast',
                    children: [
                        {
                            id: 25,
                            title: 'New York',
                            children: [
                                {
                                    id: 3413,
                                    title: 'New York'
                                },
                                {
                                    id: 4613,
                                    title: 'Rochester'
                                },
                                {
                                    id: 4516,
                                    title: 'Syracuse'
                                }
                            ]
                        },
                        {
                            id: 6,
                            title: 'Pennsylvania',
                            children: [
                                {
                                    id: 2362423,
                                    title: 'Philadelphia'
                                },
                                {
                                    id: 454663,
                                    title: 'Harrisburg'
                                },
                                {
                                    id: 454664,
                                    title: 'Scranton'
                                }
                            ]
                        }
                    ]
                }
            ];
            stop();
            setTimeout(function () {
                base.attr('locations', items);
                var itemsList = base.attr('locations');
                var treecombo = root.firstChild, breadcrumb = treecombo.firstChild, breadcrumbLIs = function () {
                        return breadcrumb.getElementsByTagName('li');
                    }, options = treecombo.lastChild, optionsLis = function () {
                        return options.getElementsByTagName('li');
                    };
                equal(breadcrumbLIs().length, 1, 'Only the default title is shown');
                equal(innerHTML(breadcrumbLIs()[0]), 'Locations', 'The correct title from the attribute is shown');
                equal(itemsList.length, optionsLis().length, 'first level items are displayed');
                can.trigger(optionsLis()[0], 'click');
                equal(optionsLis()[0].className, 'active', 'toggling something not selected adds active');
                ok(optionsLis()[0].getElementsByTagName('input')[0].checked, 'toggling something not selected checks checkbox');
                equal(can.viewModel(treecombo, 'selected').length, 1, 'there is one selected item');
                equal(can.viewModel(treecombo, 'selected.0'), itemsList.attr('0'), 'the midwest is in selected');
                can.viewModel(treecombo, 'selected').pop();
                equal(optionsLis()[0].className, '', 'toggling something not selected adds active');
                can.trigger(optionsLis()[0].getElementsByTagName('button')[0], 'click');
                equal(breadcrumbLIs().length, 2, 'Only the default title is shown');
                equal(innerHTML(breadcrumbLIs()[1]), 'Midwest', 'The breadcrumb has an item in it');
                ok(/Illinois/.test(innerHTML(optionsLis()[0])), 'A child of the top breadcrumb is displayed');
                can.trigger(optionsLis()[0].getElementsByTagName('button')[0], 'click');
                ok(/Chicago/.test(innerHTML(optionsLis()[0])), 'A child of the top breadcrumb is displayed');
                ok(!optionsLis()[0].getElementsByTagName('button').length, 'no show children button');
                can.trigger(breadcrumbLIs()[1], 'click');
                equal(innerHTML(breadcrumbLIs()[1]), 'Midwest', 'The breadcrumb has an item in it');
                ok(/Illinois/.test(innerHTML(optionsLis()[0])), 'A child of the top breadcrumb is displayed');
                can.trigger(breadcrumbLIs()[0], 'click');
                equal(breadcrumbLIs().length, 1, 'Only the default title is shown');
                equal(innerHTML(breadcrumbLIs()[0]), 'Locations', 'The correct title from the attribute is shown');
                start();
            }, 100);
        });
        test('deferred grid', function () {
            can.Component.extend({
                tag: 'grid',
                viewModel: {
                    items: [],
                    waiting: true
                },
                template: can.stache('<table><tbody><content></content></tbody></table>'),
                events: {
                    init: function () {
                        this.update();
                    },
                    '{viewModel} deferreddata': 'update',
                    update: function () {
                        var deferred = this.viewModel.attr('deferreddata'), viewModel = this.viewModel;
                        if (can.isDeferred(deferred)) {
                            this.viewModel.attr('waiting', true);
                            deferred.then(function (items) {
                                viewModel.attr('items').attr(items, true);
                            });
                        } else {
                            viewModel.attr('items').attr(deferred, true);
                        }
                    },
                    '{items} change': function () {
                        this.viewModel.attr('waiting', false);
                    }
                }
            });
            var SimulatedScope = can.Map.extend({
                set: 0,
                deferredData: function () {
                    var deferred = new can.Deferred();
                    var set = this.attr('set');
                    if (set === 0) {
                        setTimeout(function () {
                            deferred.resolve([{
                                    first: 'Justin',
                                    last: 'Meyer'
                                }]);
                        }, 100);
                    } else if (set === 1) {
                        setTimeout(function () {
                            deferred.resolve([{
                                    first: 'Brian',
                                    last: 'Moschel'
                                }]);
                        }, 100);
                    }
                    return deferred;
                }
            });
            var viewModel = new SimulatedScope();
            var template = can.stache('<grid {(deferreddata)}=\'viewModel.deferredData\'>' + '{{#each items}}' + '<tr>' + '<td width=\'40%\'>{{first}}</td>' + '<td width=\'70%\'>{{last}}</td>' + '</tr>' + '{{/each}}' + '</grid>');
            can.append(this.$fixture, template({ viewModel: viewModel }));
            var gridScope = can.viewModel(this.fixture.firstChild);
            equal(gridScope.attr('waiting'), true, 'The grid is initially waiting on the deferreddata to resolve');
            stop();
            var self = this;
            var waitingHandler = function () {
                gridScope.unbind('waiting', waitingHandler);
                setTimeout(function () {
                    var tds = self.fixture.getElementsByTagName('td');
                    equal(tds.length, 2, 'there are 2 tds');
                    gridScope.bind('waiting', function (ev, newVal) {
                        if (newVal === false) {
                            setTimeout(function () {
                                equal(innerHTML(tds[0]), 'Brian', 'td changed to brian');
                                start();
                            }, 10);
                        }
                    });
                    viewModel.attr('set', 1);
                }, 10);
            };
            gridScope.bind('waiting', waitingHandler);
        });
        test('nextprev', function () {
            can.Component.extend({
                tag: 'next-prev',
                template: can.stache('<a href="javascript://"' + 'class="prev {{#paginate.canPrev}}enabled{{/paginate.canPrev}}" ($click)="paginate.prev()">Prev</a>' + '<a href="javascript://"' + 'class="next {{#paginate.canNext}}enabled{{/paginate.canNext}}" ($click)="paginate.next()">Next</a>')
            });
            var paginator = new Paginate({
                limit: 20,
                offset: 0,
                count: 100
            });
            var template = can.stache('<next-prev {(paginate)}=\'paginator\'></next-prev>');
            var frag = template({ paginator: paginator });
            var nextPrev = frag.firstChild;
            var prev = nextPrev.firstChild, next = nextPrev.lastChild;
            ok(!/enabled/.test(prev.className), 'prev is not enabled');
            ok(/enabled/.test(next.className), 'next is  enabled');
            can.trigger(next, 'click');
            ok(/enabled/.test(prev.className), 'prev is enabled');
        });
        test('page-count', function () {
            can.Component.extend({
                tag: 'page-count',
                template: can.stache('Page <span>{{page}}</span>.')
            });
            var paginator = new Paginate({
                limit: 20,
                offset: 0,
                count: 100
            });
            var template = can.stache('<page-count {(page)}=\'paginator.page\'></page-count>');
            var frag = template(new can.Map({ paginator: paginator }));
            var span = frag.firstChild.getElementsByTagName('span')[0];
            equal(span.firstChild.nodeValue, '1');
            paginator.next();
            equal(span.firstChild.nodeValue, '2');
            paginator.next();
            equal(span.firstChild.nodeValue, '3');
        });
        test('hello-world and whitespace around custom elements', function () {
            can.Component.extend({
                tag: 'hello-world',
                template: can.stache('{{#if visible}}{{message}}{{else}}Click me{{/if}}'),
                viewModel: {
                    visible: false,
                    message: 'Hello There!'
                },
                events: {
                    click: function () {
                        this.viewModel.attr('visible', true);
                    }
                }
            });
            var template = can.stache('  <hello-world></hello-world>  ');
            var frag = template({});
            var helloWorld = frag.childNodes.item(1);
            can.trigger(can.$(helloWorld), 'click');
            equal(innerHTML(helloWorld), 'Hello There!');
        });
        test('self closing content tags', function () {
            can.Component.extend({
                'tag': 'my-greeting',
                template: can.stache('<h1><content/></h1>'),
                viewModel: { title: 'can.Component' }
            });
            var template = can.stache('<my-greeting><span>{{site}} - {{title}}</span></my-greeting>');
            var frag = template({ site: 'CanJS' });
            equal(frag.firstChild.getElementsByTagName('span').length, 1, 'there is an h1');
        });
        test('can.viewModel utility', function () {
            can.Component({
                tag: 'my-taggy-tag',
                template: can.stache('<h1>hello</h1>'),
                viewModel: { foo: 'bar' }
            });
            var frag = can.stache('<my-taggy-tag id=\'x\'></my-taggy-tag>')();
            var el = can.$(frag.firstChild);
            equal(can.viewModel(el), can.data(el, 'viewModel'), 'one argument grabs the viewModel object');
            equal(can.viewModel(el, 'foo'), 'bar', 'two arguments fetches a value');
            can.viewModel(el, 'foo', 'baz');
            equal(can.viewModel(el, 'foo'), 'baz', 'Three arguments sets the value');
            if (window.$ && $.fn) {
                el = $(frag.firstChild);
                equal(el.viewModel(), can.data(el, 'viewModel'), 'jQuery helper grabs the viewModel object');
                equal(el.viewModel('foo'), 'baz', 'jQuery helper with one argument fetches a property');
                equal(el.viewModel('foo', 'bar').get(0), el.get(0), 'jQuery helper returns the element');
                equal(el.viewModel('foo'), 'bar', 'jQuery helper with two arguments sets the property');
            }
        });
        test('can.viewModel backwards compatible with can.scope', function () {
            equal(can.viewModel, can.scope, 'can helper');
            if (window.$ && $.fn) {
                equal($.scope, $.viewModel, 'jQuery helper');
            }
        });
        test('can.viewModel creates one if it doesn\'t exist', function () {
            var frag = can.stache('<div id=\'me\'></div>')();
            var el = can.$(frag.firstChild);
            var viewModel = can.viewModel(el);
            ok(!!viewModel, 'viewModel created where it didn\'t exist.');
            equal(viewModel, can.data(el, 'viewModel'), 'viewModel is in the data.');
        });
        test('setting passed variables - two way binding', function () {
            can.Component.extend({
                tag: 'my-toggler',
                template: can.stache('{{#if visible}}<content/>{{/if}}'),
                viewModel: {
                    visible: true,
                    show: function () {
                        this.attr('visible', true);
                    },
                    hide: function () {
                        this.attr('visible', false);
                    }
                }
            });
            can.Component.extend({
                tag: 'my-app',
                viewModel: {
                    visible: true,
                    show: function () {
                        this.attr('visible', true);
                    }
                }
            });
            var template = can.stache('<my-app>' + '{{^visible}}<button can-click="show">show</button>{{/visible}}' + '<my-toggler {(visible)}="visible">' + 'content' + '<button can-click="hide">hide</button>' + '</my-toggler>' + '</my-app>');
            var frag = template({});
            var myApp = frag.firstChild, buttons = myApp.getElementsByTagName('button');
            equal(buttons.length, 1, 'there is one button');
            equal(innerHTML(buttons[0]), 'hide', 'the button\'s text is hide');
            can.trigger(buttons[0], 'click');
            buttons = myApp.getElementsByTagName('button');
            equal(buttons.length, 1, 'there is one button');
            equal(innerHTML(buttons[0]), 'show', 'the button\'s text is show');
            can.trigger(buttons[0], 'click');
            buttons = myApp.getElementsByTagName('button');
            equal(buttons.length, 1, 'there is one button');
            equal(innerHTML(buttons[0]), 'hide', 'the button\'s text is hide');
        });
        test('helpers reference the correct instance (#515)', function () {
            expect(2);
            can.Component({
                tag: 'my-text',
                template: can.stache('<p>{{valueHelper}}</p>'),
                helpers: {
                    valueHelper: function () {
                        return this.attr('value');
                    }
                }
            });
            var template = can.stache('<my-text value="value1"></my-text><my-text value="value2"></my-text>');
            var frag = template({});
            equal(frag.firstChild.firstChild.firstChild.nodeValue, 'value1');
            equal(frag.lastChild.firstChild.firstChild.nodeValue, 'value2');
        });
        test('access hypenated attributes via camelCase or hypenated', function () {
            can.Component({
                tag: 'hyphen',
                viewModel: {},
                template: can.stache('<p>{{valueHelper}}</p>'),
                helpers: {
                    valueHelper: function () {
                        return this.attr('camelCase');
                    }
                }
            });
            var template = can.stache('<hyphen camel-case="value1"></hyphen>');
            var frag = template({});
            equal(frag.firstChild.firstChild.firstChild.nodeValue, 'value1');
        });
        test('a map as viewModel', function () {
            var me = new can.Map({ name: 'Justin' });
            can.Component.extend({
                tag: 'my-viewmodel',
                template: can.stache('{{name}}}'),
                viewModel: me
            });
            var template = can.stache('<my-viewmodel></my-viewmodel>');
            equal(template().firstChild.firstChild.nodeValue, 'Justin');
        });
        test('content in a list', function () {
            var template = can.stache('<my-list>{{name}}</my-list>');
            can.Component.extend({
                tag: 'my-list',
                template: can.stache('{{#each items}}<li><content/></li>{{/each}}'),
                viewModel: {
                    items: new can.List([
                        { name: 'one' },
                        { name: 'two' }
                    ])
                }
            });
            var lis = template().firstChild.getElementsByTagName('li');
            equal(innerHTML(lis[0]), 'one', 'first li has correct content');
            equal(innerHTML(lis[1]), 'two', 'second li has correct content');
        });
        test('don\'t update computes unnecessarily', function () {
            var sourceAge = 30, timesComputeIsCalled = 0;
            var age = can.compute(function (newVal) {
                timesComputeIsCalled++;
                if (timesComputeIsCalled === 1) {
                    ok(true, 'reading initial value to set as years');
                } else if (timesComputeIsCalled === 2) {
                    equal(newVal, 31, 'updating value to 31');
                } else if (timesComputeIsCalled === 3) {
                    ok(true, 'called back another time after set to get the value');
                } else {
                    ok(false, 'You\'ve called the callback ' + timesComputeIsCalled + ' times');
                }
                if (arguments.length) {
                    sourceAge = newVal;
                } else {
                    return sourceAge;
                }
            });
            can.Component.extend({ tag: 'age-er' });
            var template = can.stache('<age-er {(years)}=\'age\'></age-er>');
            template({ age: age });
            age(31);
        });
        test('component does not respect can.compute passed via attributes (#540)', function () {
            var data = { compute: can.compute(30) };
            can.Component.extend({
                tag: 'my-component',
                template: can.stache('<span>{{blocks}}</span>')
            });
            var template = can.stache('<my-component {(blocks)}=\'compute\'></my-component>');
            var frag = template(data);
            equal(innerHTML(frag.firstChild.firstChild), '30');
        });
        test('defined view models (#563)', function () {
            var HelloWorldModel = can.Map.extend({
                visible: true,
                toggle: function () {
                    this.attr('visible', !this.attr('visible'));
                }
            });
            can.Component.extend({
                tag: 'my-helloworld',
                template: can.stache('<h1>{{#if visible}}visible{{else}}invisible{{/if}}</h1>'),
                viewModel: HelloWorldModel
            });
            var template = can.stache('<my-helloworld></my-helloworld>');
            var frag = template({});
            equal(innerHTML(frag.firstChild.firstChild), 'visible');
        });
        test('viewModel not rebound correctly (#550)', function () {
            var nameChanges = 0;
            can.Component.extend({
                tag: 'viewmodel-rebinder',
                events: {
                    '{name} change': function () {
                        nameChanges++;
                    }
                }
            });
            var template = can.stache('<viewmodel-rebinder></viewmodel-rebinder>');
            var frag = template();
            var viewModel = can.viewModel(can.$(frag.firstChild));
            var n1 = can.compute(), n2 = can.compute();
            viewModel.attr('name', n1);
            n1('updated');
            viewModel.attr('name', n2);
            n2('updated');
            equal(nameChanges, 2);
        });
        test('content extension stack overflow error', function () {
            can.Component({
                tag: 'outer-tag',
                template: can.stache('<inner-tag>inner-tag CONTENT <content/></inner-tag>')
            });
            can.Component({
                tag: 'inner-tag',
                template: can.stache('inner-tag TEMPLATE <content/>')
            });
            var template = can.stache('<outer-tag>outer-tag CONTENT</outer-tag>');
            var frag = template();
            equal(innerHTML(frag.firstChild.firstChild), 'inner-tag TEMPLATE inner-tag CONTENT outer-tag CONTENT');
        });
        test('inserted event fires twice if component inside live binding block', function () {
            var inited = 0, inserted = 0;
            can.Component({
                tag: 'child-tag',
                viewModel: {
                    init: function () {
                        inited++;
                    }
                },
                events: {
                    ' inserted': function () {
                        inserted++;
                    }
                }
            });
            can.Component({
                tag: 'parent-tag',
                template: can.stache('{{#shown}}<child-tag></child-tag>{{/shown}}'),
                viewModel: { shown: false },
                events: {
                    ' inserted': function () {
                        this.viewModel.attr('shown', true);
                    }
                }
            });
            var frag = can.stache('<parent-tag></parent-tag>')({});
            can.append(this.$fixture, frag);
            equal(inited, 1);
            equal(inserted, 1);
        });
        test('@ keeps properties live now', function () {
            can.Component.extend({
                tag: 'attr-fun',
                template: can.stache('<h1>{{fullName}}</h1>'),
                viewModel: {
                    fullName: function () {
                        return this.attr('firstName') + ' ' + this.attr('lastName');
                    }
                }
            });
            var frag = can.stache('<attr-fun first-name=\'Justin\' last-name=\'Meyer\'></attr-fun>')();
            var attrFun = frag.firstChild;
            this.fixture.appendChild(attrFun);
            equal(innerHTML(attrFun.firstChild), 'Justin Meyer');
            can.attr.set(attrFun, 'first-name', 'Brian');
            stop();
            setTimeout(function () {
                equal(attrFun.firstChild.firstChild.nodeValue, 'Brian Meyer');
                start();
            }, 100);
        });
        test('id and class should work now (#694)', function () {
            can.Component.extend({
                tag: 'stay-classy',
                viewModel: {
                    notid: 'foo',
                    notclass: 5,
                    notdataviewid: {}
                }
            });
            var data = {
                idData: 'id-success',
                classData: 'class-success'
            };
            var frag = can.stache('<stay-classy {(id)}=\'idData\'' + ' {(class)}=\'classData\'></stay-classy>')(data);
            var stayClassy = frag.firstChild;
            can.append(this.$fixture, frag);
            var viewModel = can.viewModel(stayClassy);
            equal(viewModel.attr('id'), 'id-success');
            equal(viewModel.attr('class'), 'class-success');
        });
        test('Component can-click method should be not called while component\'s init', function () {
            var called = false;
            can.Component.extend({ tag: 'child-tag' });
            can.Component.extend({
                tag: 'parent-tag',
                template: can.stache('<child-tag can-click="method"></child-tag>'),
                viewModel: {
                    method: function () {
                        called = true;
                    }
                }
            });
            can.stache('<parent-tag></parent-tag>')();
            equal(called, false);
        });
        test('Same component tag nested', function () {
            can.Component({
                'tag': 'my-tag',
                template: can.stache('<p><content/></p>')
            });
            var template = can.stache('<div><my-tag>Outter<my-tag>Inner</my-tag></my-tag></div>');
            var template2 = can.stache('<div><my-tag>3<my-tag>2<my-tag>1<my-tag>0</my-tag></my-tag></my-tag></my-tag></div>');
            var template3 = can.stache('<div><my-tag>First</my-tag><my-tag>Second</my-tag></div>');
            equal(template({}).firstChild.getElementsByTagName('p').length, 2, 'proper number of p tags');
            equal(template2({}).firstChild.getElementsByTagName('p').length, 4, 'proper number of p tags');
            equal(template3({}).firstChild.getElementsByTagName('p').length, 2, 'proper number of p tags');
        });
        test('Component events bind to window', function () {
            window.tempMap = new can.Map();
            can.Component.extend({
                tag: 'window-events',
                events: {
                    '{tempMap} prop': function () {
                        ok(true, 'called templated event');
                    }
                }
            });
            var template = can.stache('<window-events></window-events>');
            template();
            window.tempMap.attr('prop', 'value');
            window.tempMap = undefined;
            try {
                delete window.tempMap;
            } catch (e) {
            }
        });
        test('can.Construct are passed normally', function () {
            var Constructed = can.Construct.extend({ foo: 'bar' }, {});
            can.Component.extend({
                tag: 'con-struct',
                template: can.stache('{{con.foo}}')
            });
            var stached = can.stache('<con-struct {(con)}=\'Constructed\'></con-struct>');
            var res = stached({ Constructed: Constructed });
            equal(innerHTML(res.firstChild), 'bar');
        });
        test('passing id works now', function () {
            can.Component.extend({
                tag: 'my-thing',
                template: can.stache('hello')
            });
            var stache = can.stache('<my-thing {(id)}=\'productId\'></my-tagged>');
            var frag = stache(new can.Map({ productId: 123 }));
            equal(can.viewModel(frag.firstChild).attr('id'), 123);
        });
        test('stache conditionally nested components calls inserted once (#967)', function () {
            expect(1);
            can.Component.extend({
                tag: 'can-parent-stache',
                viewModel: { shown: true },
                template: can.stache('{{#if shown}}<can-child></can-child>{{/if}}')
            });
            can.Component.extend({
                tag: 'can-child',
                events: {
                    inserted: function () {
                        this.viewModel.attr('bar', 'foo');
                        ok(true, 'called inserted once');
                    }
                }
            });
            var template = can.stache('<can-parent-stache></can-parent-stache>');
            can.append(this.$fixture, template());
        });
        test('hyphen-less tag names', function () {
            var template = can.stache('<span></span><foobar></foobar>');
            can.Component.extend({
                tag: 'foobar',
                template: can.stache('<div>{{name}}</div>'),
                viewModel: { name: 'Brian' }
            });
            equal(template().lastChild.firstChild.firstChild.nodeValue, 'Brian');
        });
        test('nested component within an #if is not live bound(#1025)', function () {
            can.Component.extend({
                tag: 'parent-component',
                template: can.stache('{{#if shown}}<child-component></child-component>{{/if}}'),
                viewModel: { shown: false }
            });
            can.Component.extend({
                tag: 'child-component',
                template: can.stache('Hello world.')
            });
            var template = can.stache('<parent-component></parent-component>');
            var frag = template({});
            equal(innerHTML(frag.firstChild), '', 'child component is not inserted');
            can.viewModel(frag.firstChild).attr('shown', true);
            equal(innerHTML(frag.firstChild.firstChild), 'Hello world.', 'child component is inserted');
            can.viewModel(frag.firstChild).attr('shown', false);
            equal(innerHTML(frag.firstChild), '', 'child component is removed');
        });
        test('component does not update viewModel on id, class, and data-view-id attribute changes (#1079)', function () {
            can.Component.extend({ tag: 'x-app' });
            var frag = can.stache('<x-app></x-app>')({});
            var el = frag.firstChild;
            var viewModel = can.viewModel(el);
            can.append(this.$fixture, frag);
            can.addClass(can.$(el), 'foo');
            stop();
            setTimeout(function () {
                equal(viewModel.attr('class'), undefined, 'the viewModel is not updated when the class attribute changes');
                start();
            }, 20);
        });
        test('viewModel objects with Constructor functions as properties do not get converted (#1261)', 1, function () {
            stop();
            var Test = can.Map.extend({ test: 'Yeah' });
            can.Component.extend({
                tag: 'my-app',
                viewModel: { MyConstruct: Test },
                events: {
                    '{MyConstruct} something': function () {
                        ok(true, 'Event got triggered');
                        start();
                    }
                }
            });
            var frag = can.stache('<my-app></my-app>')();
            can.append(this.$fixture, frag);
            can.trigger(Test, 'something');
        });
        test('removing bound viewModel properties on destroy #1415', function () {
            var state = new can.Map({
                product: {
                    id: 1,
                    name: 'Tom'
                }
            });
            can.Component.extend({
                tag: 'destroyable-component',
                events: {
                    destroy: function () {
                        this.viewModel.attr('product', null);
                    }
                }
            });
            var frag = can.stache('<destroyable-component {(product)}="product"></destroyable-component>')(state);
            can.append(this.$fixture, frag);
            can.remove(can.$(this.fixture.firstChild));
            ok(state.attr('product') == null, 'product was removed');
        });
        test('changing viewModel property rebinds {viewModel.<...>} events (#1529)', 2, function () {
            can.Component.extend({
                tag: 'rebind-viewmodel',
                events: {
                    inserted: function () {
                        this.viewModel.attr('item', {});
                    },
                    '{scope.item} change': function () {
                        ok(true, 'Change event on scope');
                    },
                    '{viewModel.item} change': function () {
                        ok(true, 'Change event on viewModel');
                    }
                }
            });
            var frag = can.stache('<rebind-viewmodel></rebind-viewmodel>')();
            var rebind = frag.firstChild;
            can.append(this.$fixture, rebind);
            can.viewModel(can.$(rebind)).attr('item.name', 'CDN');
        });
        test('Component two way binding loop (#1579)', function () {
            var changeCount = 0;
            can.Component.extend({
                tag: 'product-swatch-color',
                viewModel: { tag: 'product-swatch-color' }
            });
            can.Component.extend({
                tag: 'product-swatch',
                template: can.stache('<product-swatch-color {(variations)}="variations"></product-swatch-color>'),
                viewModel: can.Map.extend({
                    tag: 'product-swatch',
                    define: {
                        variations: {
                            set: function (variations) {
                                if (changeCount > 500) {
                                    return;
                                }
                                changeCount++;
                                return new can.List(variations.attr());
                            }
                        }
                    }
                })
            });
            var frag = can.stache('<product-swatch></product-swatch>')(), productSwatch = frag.firstChild;
            can.batch.start();
            can.viewModel(can.$(productSwatch)).attr('variations', new can.List());
            can.batch.stop();
            ok(changeCount < 500, 'more than 500 events');
        });
        test('DOM trees not releasing when referencing can.Map inside can.Map in template (#1593)', function () {
            var baseTemplate = can.stache('{{#if show}}<my-outside></my-outside>{{/if}}'), show = can.compute(true), state = new can.Map({ inner: 1 });
            var removeCount = 0;
            can.Component.extend({
                tag: 'my-inside',
                events: {
                    removed: function () {
                        removeCount++;
                    }
                }
            });
            can.Component.extend({
                tag: 'my-outside',
                template: can.stache('{{#if state.inner}}<my-inside></my-inside>{{/if}}')
            });
            can.append(this.$fixture, baseTemplate({
                show: show,
                state: state
            }));
            show(false);
            state.removeAttr('inner');
            equal(removeCount, 1, 'internal removed once');
            show(true);
            state.attr('inner', 2);
            state.removeAttr('inner');
            equal(removeCount, 2, 'internal removed twice');
        });
        test('references scopes are available to bindings nested in components (#2029)', function () {
            var template = can.stache('<export-er {^value}="*reference" />' + '<wrap-er><simple-example {key}="*reference"/></wrap-er>');
            can.Component.extend({ tag: 'wrap-er' });
            can.Component.extend({
                tag: 'export-er',
                events: {
                    'init': function () {
                        var self = this.viewModel;
                        stop();
                        setTimeout(function () {
                            self.attr('value', 100);
                            var wrapper = frag.lastChild, simpleExample = wrapper.firstChild, textNode = simpleExample.firstChild;
                            equal(textNode.nodeValue, '100', 'updated value with reference');
                            start();
                        }, 10);
                    }
                }
            });
            can.Component.extend({
                tag: 'simple-example',
                template: can.stache('{{key}}'),
                viewModel: {}
            });
            var frag = template({});
        });
        test('two-way binding syntax PRIOR to v2.3 shall NOT let a child property initialize an undefined parent property (#2020)', function () {
            var renderer = can.stache('<pa-rent/>');
            can.Component.extend({
                tag: 'pa-rent',
                template: can.stache('<chi-ld child-prop="{parentProp}" />')
            });
            can.Component.extend({
                tag: 'chi-ld',
                viewModel: { childProp: 'bar' }
            });
            var frag = renderer({});
            var parentVM = can.viewModel(frag.firstChild);
            var childVM = can.viewModel(frag.firstChild.firstChild);
            equal(parentVM.attr('parentProp'), undefined, 'parentProp is undefined');
            equal(childVM.attr('childProp'), 'bar', 'childProp is bar');
            parentVM.attr('parentProp', 'foo');
            equal(parentVM.attr('parentProp'), 'foo', 'parentProp is foo');
            equal(childVM.attr('childProp'), 'foo', 'childProp is foo');
            childVM.attr('childProp', 'baz');
            equal(parentVM.attr('parentProp'), 'baz', 'parentProp is baz');
            equal(childVM.attr('childProp'), 'baz', 'childProp is baz');
        });
        test('two-way binding syntax INTRODUCED in v2.3 ALLOWS a child property to initialize an undefined parent property', function () {
            var renderer = can.stache('<pa-rent/>');
            can.Component.extend({
                tag: 'pa-rent',
                template: can.stache('<chi-ld {(child-prop)}="parentProp" />')
            });
            can.Component.extend({
                tag: 'chi-ld',
                viewModel: { childProp: 'bar' }
            });
            var frag = renderer({});
            var parentVM = can.viewModel(frag.firstChild);
            var childVM = can.viewModel(frag.firstChild.firstChild);
            equal(parentVM.attr('parentProp'), 'bar', 'parentProp is bar');
            equal(childVM.attr('childProp'), 'bar', 'childProp is bar');
            parentVM.attr('parentProp', 'foo');
            equal(parentVM.attr('parentProp'), 'foo', 'parentProp is foo');
            equal(childVM.attr('childProp'), 'foo', 'childProp is foo');
            childVM.attr('childProp', 'baz');
            equal(parentVM.attr('parentProp'), 'baz', 'parentProp is baz');
            equal(childVM.attr('childProp'), 'baz', 'childProp is baz');
        });
        test('conditional attributes (#2077)', function () {
            can.Component.extend({
                tag: 'some-comp',
                viewModel: {}
            });
            var template = can.stache('<some-comp ' + '{{#if preview}}{next}=\'nextPage\'{{/if}} ' + '{swap}=\'{{swapName}}\' ' + '{{#preview}}checked{{/preview}} ' + '></some-comp>');
            var map = new can.Map({
                preview: true,
                nextPage: 2,
                swapName: 'preview'
            });
            var frag = template(map);
            var vm = can.viewModel(frag.firstChild);
            var threads = [
                function () {
                    equal(vm.attr('next'), 2, 'has binidng');
                    equal(vm.attr('swap'), true, 'swap - has binding');
                    equal(vm.attr('checked'), '', 'attr - has binding');
                    map.attr('preview', false);
                },
                function () {
                    equal(vm.attr('swap'), false, 'swap - updated binidng');
                    ok(vm.attr('checked') === null, 'attr - value set to null');
                    map.attr('nextPage', 3);
                    equal(vm.attr('next'), 2, 'not updating after binding is torn down');
                    map.attr('preview', true);
                },
                function () {
                    equal(vm.attr('next'), 3, 're-initialized with binding');
                    equal(vm.attr('swap'), true, 'swap - updated binidng');
                    equal(vm.attr('checked'), '', 'attr - has binding set again');
                    map.attr('swapName', 'nextPage');
                },
                function () {
                    equal(vm.attr('swap'), 3, 'swap - updated binding key');
                    map.attr('nextPage', 4);
                    equal(vm.attr('swap'), 4, 'swap - updated binding');
                }
            ];
            stop();
            var index = 0;
            var next = function () {
                if (index < threads.length) {
                    threads[index]();
                    index++;
                    setTimeout(next, 10);
                } else {
                    start();
                }
            };
            setTimeout(next, 10);
        });
        test('<content> (#2151)', function () {
            can.Component.extend({
                tag: 'list-items',
                template: can.stache('<ul>' + '{{#items}}' + '{{#if render}}' + '<li><content /></li>' + '{{/if}}' + '{{/items}}' + '</ul>'),
                viewModel: {
                    define: {
                        items: {
                            value: function () {
                                return new can.List([
                                    {
                                        id: 1,
                                        context: 'Item 1',
                                        render: false
                                    },
                                    {
                                        id: 2,
                                        context: 'Item 2',
                                        render: false
                                    }
                                ]);
                            }
                        }
                    }
                }
            });
            can.Component.extend({
                tag: 'list-item',
                template: can.stache('{{item.context}}')
            });
            var template = can.stache('<list-items><list-item item=\'{.}\'/></list-items>');
            var frag = template();
            can.batch.start();
            can.viewModel(frag.firstChild).attr('items').each(function (item, index) {
                item.attr('render', true);
            });
            can.batch.stop();
            var lis = frag.firstChild.getElementsByTagName('li');
            ok(innerHTML(lis[0]).indexOf('Item 1') >= 0, 'Item 1 written out');
            ok(innerHTML(lis[1]).indexOf('Item 2') >= 0, 'Item 2 written out');
        });
    }
    makeTest('can/component new bindings dom', document);
});
/*component/component_test*/
define('can/component/component_test', function (require, exports, module) {
    var can = require('can/can');
    require('can/util/vdom/document/document');
    require('can/util/vdom/build_fragment/build_fragment');
    require('can/map/define/define');
    require('can/component/component');
    require('can/view/stache/stache');
    require('can/route/route');
    require('steal-qunit');
    require('can/component/component_bindings_test.js');
    var simpleDocument = can.simpleDocument;
    var innerHTML = function (node) {
        if ('innerHTML' in node) {
            return node.innerHTML;
        }
    };
    function makeTest(name, doc) {
        var oldDoc;
        QUnit.module(name, {
            setup: function () {
                oldDoc = can.document;
                can.document = doc;
                if (doc) {
                    this.fixture = doc.createElement('div');
                    doc.body.appendChild(this.fixture);
                    this.$fixture = can.$(this.fixture);
                } else {
                    this.fixture = can.$('#qunit-fixture')[0];
                    this.$fixture = can.$('#qunit-fixture');
                }
            },
            teardown: function () {
                can.document = oldDoc;
                if (doc) {
                    doc.body.removeChild(this.fixture);
                }
            }
        });
        var Paginate = can.Map.extend({
            count: Infinity,
            offset: 0,
            limit: 100,
            setCount: function (newCount, success, error) {
                return newCount < 0 ? 0 : newCount;
            },
            setOffset: function (newOffset) {
                return newOffset < 0 ? 0 : Math.min(newOffset, !isNaN(this.count - 1) ? this.count - 1 : Infinity);
            },
            next: function () {
                this.attr('offset', this.offset + this.limit);
            },
            prev: function () {
                this.attr('offset', this.offset - this.limit);
            },
            canNext: function () {
                return this.attr('offset') < this.attr('count') - this.attr('limit');
            },
            canPrev: function () {
                return this.attr('offset') > 0;
            },
            page: function (newVal) {
                if (newVal === undefined) {
                    return Math.floor(this.attr('offset') / this.attr('limit')) + 1;
                } else {
                    this.attr('offset', (parseInt(newVal) - 1) * this.attr('limit'));
                }
            },
            pageCount: function () {
                return this.attr('count') ? Math.ceil(this.attr('count') / this.attr('limit')) : null;
            }
        });
        test('basic tabs', function () {
            can.Component.extend({
                tag: 'tabs',
                template: can.stache('<ul>' + '{{#panels}}' + '<li {{#isActive}}class=\'active\'{{/isActive}} can-click=\'makeActive\'>{{title}}</li>' + '{{/panels}}' + '</ul>' + '<content></content>'),
                viewModel: {
                    panels: [],
                    addPanel: function (panel) {
                        if (this.attr('panels').length === 0) {
                            this.makeActive(panel);
                        }
                        this.attr('panels').push(panel);
                    },
                    removePanel: function (panel) {
                        var panels = this.attr('panels');
                        can.batch.start();
                        panels.splice(panels.indexOf(panel), 1);
                        if (panel === this.attr('active')) {
                            if (panels.length) {
                                this.makeActive(panels[0]);
                            } else {
                                this.removeAttr('active');
                            }
                        }
                        can.batch.stop();
                    },
                    makeActive: function (panel) {
                        this.attr('active', panel);
                        this.attr('panels').each(function (panel) {
                            panel.attr('active', false);
                        });
                        panel.attr('active', true);
                    },
                    isActive: function (panel) {
                        return this.attr('active') === panel;
                    }
                }
            });
            can.Component.extend({
                template: can.stache('{{#if active}}<content></content>{{/if}}'),
                tag: 'panel',
                viewModel: {
                    active: false,
                    title: '@'
                },
                events: {
                    ' inserted': function () {
                        can.viewModel(this.element[0].parentNode).addPanel(this.viewModel);
                    },
                    ' removed': function () {
                        if (!can.viewModel(this.element[0].parentNode)) {
                            console.log('bruke');
                        }
                        can.viewModel(this.element[0].parentNode).removePanel(this.viewModel);
                    }
                }
            });
            var template = can.stache('<tabs>{{#each foodTypes}}<panel title=\'{{title}}\'>{{content}}</panel>{{/each}}</tabs>');
            var foodTypes = new can.List([
                {
                    title: 'Fruits',
                    content: 'oranges, apples'
                },
                {
                    title: 'Breads',
                    content: 'pasta, cereal'
                },
                {
                    title: 'Sweets',
                    content: 'ice cream, candy'
                }
            ]);
            var frag = template({ foodTypes: foodTypes });
            can.append(this.$fixture, frag);
            var testArea = this.fixture, lis = testArea.getElementsByTagName('li');
            equal(lis.length, 3, 'three lis added');
            foodTypes.each(function (type, i) {
                equal(innerHTML(lis[i]), type.attr('title'), 'li ' + i + ' has the right content');
            });
            foodTypes.push({
                title: 'Vegies',
                content: 'carrots, kale'
            });
            lis = testArea.getElementsByTagName('li');
            equal(lis.length, 4, 'li added');
            foodTypes.each(function (type, i) {
                equal(innerHTML(lis[i]), type.attr('title'), 'li ' + i + ' has the right content');
            });
            equal(testArea.getElementsByTagName('panel').length, 4, 'panel added');
            foodTypes.shift();
            lis = testArea.getElementsByTagName('li');
            equal(lis.length, 3, 'removed li after shifting a foodType');
            foodTypes.each(function (type, i) {
                equal(innerHTML(lis[i]), type.attr('title'), 'li ' + i + ' has the right content');
            });
            var panels = testArea.getElementsByTagName('panel');
            equal(lis[0].className, 'active', 'the first element is active');
            equal(innerHTML(panels[0]), 'pasta, cereal', 'the first content is shown');
            equal(innerHTML(panels[1]), '', 'the second content is removed');
            can.trigger(lis[1], 'click');
            lis = testArea.getElementsByTagName('li');
            equal(lis[1].className, 'active', 'the second element is active');
            equal(lis[0].className, '', 'the first element is not active');
            equal(innerHTML(panels[0]), '', 'the second content is removed');
            equal(innerHTML(panels[1]), 'ice cream, candy', 'the second content is shown');
        });
        test('lexical scoping', function () {
            can.Component.extend({
                tag: 'hello-world',
                leakScope: false,
                template: can.stache('{{greeting}} <content>World</content>{{exclamation}}'),
                viewModel: { greeting: 'Hello' }
            });
            var template = can.stache('<hello-world>{{greeting}}</hello-world>');
            var frag = template({
                greeting: 'World',
                exclamation: '!'
            });
            var hello = frag.firstChild;
            equal(can.trim(innerHTML(hello)), 'Hello World');
            can.Component.extend({
                tag: 'hello-world-no-template',
                leakScope: false,
                viewModel: { greeting: 'Hello' }
            });
            template = can.stache('<hello-world-no-template>{{greeting}}</hello-world-no-template>');
            frag = template({
                greeting: 'World',
                exclamation: '!'
            });
            hello = frag.firstChild;
            equal(can.trim(innerHTML(hello)), 'Hello', 'If no template is provided to can.Component, treat <content> bindings as dynamic.');
        });
        test('dynamic scoping', function () {
            can.Component.extend({
                tag: 'hello-world',
                leakScope: true,
                template: can.stache('{{greeting}} <content>World</content>{{exclamation}}'),
                viewModel: { greeting: 'Hello' }
            });
            var template = can.stache('<hello-world>{{greeting}}</hello-world>');
            var frag = template({
                greeting: 'World',
                exclamation: '!'
            });
            var hello = frag.firstChild;
            equal(can.trim(innerHTML(hello)), 'Hello Hello!');
        });
        test('treecombo', function () {
            can.Component.extend({
                tag: 'treecombo',
                template: can.stache('<ul class=\'breadcrumb\'>' + '<li can-click=\'emptyBreadcrumb\'>{{title}}</li>' + '{{#each breadcrumb}}' + '<li can-click=\'updateBreadcrumb\'>{{title}}</li>' + '{{/each}}' + '</ul>' + '<ul class=\'options\'>' + '<content>' + '{{#selectableItems}}' + '<li {{#isSelected}}class=\'active\'{{/isSelected}} can-click=\'toggle\'>' + '<input type=\'checkbox\' {{#isSelected}}checked{{/isSelected}}/>' + '{{title}}' + '{{#if children.length}}' + '<button class=\'showChildren\' can-click=\'showChildren\'>+</button>' + '{{/if}}' + '</li>' + '{{/selectableItems}}' + '</content>' + '</ul>'),
                viewModel: {
                    items: [],
                    breadcrumb: [],
                    selected: [],
                    selectableItems: function () {
                        var breadcrumb = this.attr('breadcrumb');
                        if (breadcrumb.attr('length')) {
                            return breadcrumb.attr('' + (breadcrumb.length - 1) + '.children');
                        } else {
                            return this.attr('items');
                        }
                    },
                    showChildren: function (item, el, ev) {
                        ev.stopPropagation();
                        this.attr('breadcrumb').push(item);
                    },
                    emptyBreadcrumb: function () {
                        this.attr('breadcrumb').attr([], true);
                    },
                    updateBreadcrumb: function (item) {
                        var breadcrumb = this.attr('breadcrumb'), index = breadcrumb.indexOf(item);
                        breadcrumb.splice(index + 1, breadcrumb.length - index - 1);
                    },
                    toggle: function (item) {
                        var selected = this.attr('selected'), index = selected.indexOf(item);
                        if (index === -1) {
                            selected.push(item);
                        } else {
                            selected.splice(index, 1);
                        }
                    }
                },
                helpers: {
                    isSelected: function (options) {
                        if (this.attr('selected').indexOf(options.context) > -1) {
                            return options.fn();
                        } else {
                            return options.inverse();
                        }
                    }
                }
            });
            var template = can.stache('<treecombo items=\'{locations}\' title=\'Locations\'></treecombo>');
            var base = new can.Map({});
            var frag = template(base);
            var root = doc.createElement('div');
            root.appendChild(frag);
            var items = [
                {
                    id: 1,
                    title: 'Midwest',
                    children: [
                        {
                            id: 5,
                            title: 'Illinois',
                            children: [
                                {
                                    id: 23423,
                                    title: 'Chicago'
                                },
                                {
                                    id: 4563,
                                    title: 'Springfield'
                                },
                                {
                                    id: 4564,
                                    title: 'Naperville'
                                }
                            ]
                        },
                        {
                            id: 6,
                            title: 'Wisconsin',
                            children: [
                                {
                                    id: 232423,
                                    title: 'Milwaulkee'
                                },
                                {
                                    id: 45463,
                                    title: 'Green Bay'
                                },
                                {
                                    id: 45464,
                                    title: 'Madison'
                                }
                            ]
                        }
                    ]
                },
                {
                    id: 2,
                    title: 'East Coast',
                    children: [
                        {
                            id: 25,
                            title: 'New York',
                            children: [
                                {
                                    id: 3413,
                                    title: 'New York'
                                },
                                {
                                    id: 4613,
                                    title: 'Rochester'
                                },
                                {
                                    id: 4516,
                                    title: 'Syracuse'
                                }
                            ]
                        },
                        {
                            id: 6,
                            title: 'Pennsylvania',
                            children: [
                                {
                                    id: 2362423,
                                    title: 'Philadelphia'
                                },
                                {
                                    id: 454663,
                                    title: 'Harrisburg'
                                },
                                {
                                    id: 454664,
                                    title: 'Scranton'
                                }
                            ]
                        }
                    ]
                }
            ];
            stop();
            setTimeout(function () {
                base.attr('locations', items);
                var itemsList = base.attr('locations');
                var treecombo = root.firstChild, breadcrumb = treecombo.firstChild, breadcrumbLIs = function () {
                        return breadcrumb.getElementsByTagName('li');
                    }, options = treecombo.lastChild, optionsLis = function () {
                        return options.getElementsByTagName('li');
                    };
                equal(breadcrumbLIs().length, 1, 'Only the default title is shown');
                equal(innerHTML(breadcrumbLIs()[0]), 'Locations', 'The correct title from the attribute is shown');
                equal(itemsList.length, optionsLis().length, 'first level items are displayed');
                can.trigger(optionsLis()[0], 'click');
                equal(optionsLis()[0].className, 'active', 'toggling something not selected adds active');
                ok(optionsLis()[0].getElementsByTagName('input')[0].checked, 'toggling something not selected checks checkbox');
                equal(can.viewModel(treecombo, 'selected').length, 1, 'there is one selected item');
                equal(can.viewModel(treecombo, 'selected.0'), itemsList.attr('0'), 'the midwest is in selected');
                can.viewModel(treecombo, 'selected').pop();
                equal(optionsLis()[0].className, '', 'toggling something not selected adds active');
                can.trigger(optionsLis()[0].getElementsByTagName('button')[0], 'click');
                equal(breadcrumbLIs().length, 2, 'Only the default title is shown');
                equal(innerHTML(breadcrumbLIs()[1]), 'Midwest', 'The breadcrumb has an item in it');
                ok(/Illinois/.test(innerHTML(optionsLis()[0])), 'A child of the top breadcrumb is displayed');
                can.trigger(optionsLis()[0].getElementsByTagName('button')[0], 'click');
                ok(/Chicago/.test(innerHTML(optionsLis()[0])), 'A child of the top breadcrumb is displayed');
                ok(!optionsLis()[0].getElementsByTagName('button').length, 'no show children button');
                can.trigger(breadcrumbLIs()[1], 'click');
                equal(innerHTML(breadcrumbLIs()[1]), 'Midwest', 'The breadcrumb has an item in it');
                ok(/Illinois/.test(innerHTML(optionsLis()[0])), 'A child of the top breadcrumb is displayed');
                can.trigger(breadcrumbLIs()[0], 'click');
                equal(breadcrumbLIs().length, 1, 'Only the default title is shown');
                equal(innerHTML(breadcrumbLIs()[0]), 'Locations', 'The correct title from the attribute is shown');
                start();
            }, 100);
        });
        test('deferred grid', function () {
            can.Component.extend({
                tag: 'grid',
                viewModel: {
                    items: [],
                    waiting: true
                },
                template: can.stache('<table><tbody><content></content></tbody></table>'),
                events: {
                    init: function () {
                        this.update();
                    },
                    '{viewModel} deferreddata': 'update',
                    update: function () {
                        var deferred = this.viewModel.attr('deferreddata'), viewModel = this.viewModel;
                        if (can.isDeferred(deferred)) {
                            this.viewModel.attr('waiting', true);
                            deferred.then(function (items) {
                                viewModel.attr('items').attr(items, true);
                            });
                        } else {
                            viewModel.attr('items').attr(deferred, true);
                        }
                    },
                    '{items} change': function () {
                        this.viewModel.attr('waiting', false);
                    }
                }
            });
            var SimulatedScope = can.Map.extend({
                set: 0,
                deferredData: function () {
                    var deferred = new can.Deferred();
                    var set = this.attr('set');
                    if (set === 0) {
                        setTimeout(function () {
                            deferred.resolve([{
                                    first: 'Justin',
                                    last: 'Meyer'
                                }]);
                        }, 100);
                    } else if (set === 1) {
                        setTimeout(function () {
                            deferred.resolve([{
                                    first: 'Brian',
                                    last: 'Moschel'
                                }]);
                        }, 100);
                    }
                    return deferred;
                }
            });
            var viewModel = new SimulatedScope();
            var template = can.stache('<grid deferreddata=\'{viewModel.deferredData}\'>' + '{{#each items}}' + '<tr>' + '<td width=\'40%\'>{{first}}</td>' + '<td width=\'70%\'>{{last}}</td>' + '</tr>' + '{{/each}}' + '</grid>');
            can.append(this.$fixture, template({ viewModel: viewModel }));
            var gridScope = can.viewModel(this.fixture.firstChild);
            equal(gridScope.attr('waiting'), true, 'The grid is initially waiting on the deferreddata to resolve');
            stop();
            var self = this;
            var waitingHandler = function () {
                gridScope.unbind('waiting', waitingHandler);
                setTimeout(function () {
                    var tds = self.fixture.getElementsByTagName('td');
                    equal(tds.length, 2, 'there are 2 tds');
                    gridScope.bind('waiting', function (ev, newVal) {
                        if (newVal === false) {
                            setTimeout(function () {
                                equal(innerHTML(tds[0]), 'Brian', 'td changed to brian');
                                start();
                            }, 10);
                        }
                    });
                    viewModel.attr('set', 1);
                }, 10);
            };
            gridScope.bind('waiting', waitingHandler);
        });
        test('nextprev', function () {
            can.Component.extend({
                tag: 'next-prev',
                template: can.stache('<a href="javascript://"' + 'class="prev {{#paginate.canPrev}}enabled{{/paginate.canPrev}}" can-click="{paginate.prev}">Prev</a>' + '<a href="javascript://"' + 'class="next {{#paginate.canNext}}enabled{{/paginate.canNext}}" can-click="{paginate.next}">Next</a>')
            });
            var paginator = new Paginate({
                limit: 20,
                offset: 0,
                count: 100
            });
            var template = can.stache('<next-prev paginate=\'{paginator}\'></next-prev>');
            var frag = template({ paginator: paginator });
            var nextPrev = frag.firstChild;
            var prev = nextPrev.firstChild, next = nextPrev.lastChild;
            ok(!/enabled/.test(prev.className), 'prev is not enabled');
            ok(/enabled/.test(next.className), 'next is  enabled');
            can.trigger(next, 'click');
            ok(/enabled/.test(prev.className), 'prev is enabled');
        });
        test('page-count', function () {
            can.Component.extend({
                tag: 'page-count',
                template: can.stache('Page <span>{{page}}</span>.')
            });
            var paginator = new Paginate({
                limit: 20,
                offset: 0,
                count: 100
            });
            var template = can.stache('<page-count page=\'{paginator.page}\'></page-count>');
            var frag = template(new can.Map({ paginator: paginator }));
            var span = frag.firstChild.getElementsByTagName('span')[0];
            equal(span.firstChild.nodeValue, '1');
            paginator.next();
            equal(span.firstChild.nodeValue, '2');
            paginator.next();
            equal(span.firstChild.nodeValue, '3');
        });
        test('hello-world and whitespace around custom elements', function () {
            can.Component.extend({
                tag: 'hello-world',
                template: can.stache('{{#if visible}}{{message}}{{else}}Click me{{/if}}'),
                viewModel: {
                    visible: false,
                    message: 'Hello There!'
                },
                events: {
                    click: function () {
                        this.viewModel.attr('visible', true);
                    }
                }
            });
            var template = can.stache('  <hello-world></hello-world>  ');
            var frag = template({});
            var helloWorld = frag.childNodes.item(1);
            can.trigger(can.$(helloWorld), 'click');
            equal(innerHTML(helloWorld), 'Hello There!');
        });
        test('self closing content tags', function () {
            can.Component.extend({
                'tag': 'my-greeting',
                template: can.stache('<h1><content/></h1>'),
                viewModel: { title: 'can.Component' }
            });
            var template = can.stache('<my-greeting><span>{{site}} - {{title}}</span></my-greeting>');
            var frag = template({ site: 'CanJS' });
            equal(frag.firstChild.getElementsByTagName('span').length, 1, 'there is an h1');
        });
        test('can.viewModel utility', function () {
            can.Component({
                tag: 'my-taggy-tag',
                template: can.stache('<h1>hello</h1>'),
                viewModel: { foo: 'bar' }
            });
            var frag = can.stache('<my-taggy-tag id=\'x\'></my-taggy-tag>')();
            var el = can.$(frag.firstChild);
            equal(can.viewModel(el), can.data(el, 'viewModel'), 'one argument grabs the viewModel object');
            equal(can.viewModel(el, 'foo'), 'bar', 'two arguments fetches a value');
            can.viewModel(el, 'foo', 'baz');
            equal(can.viewModel(el, 'foo'), 'baz', 'Three arguments sets the value');
            if (window.$ && $.fn) {
                el = $(frag.firstChild);
                equal(el.viewModel(), can.data(el, 'viewModel'), 'jQuery helper grabs the viewModel object');
                equal(el.viewModel('foo'), 'baz', 'jQuery helper with one argument fetches a property');
                equal(el.viewModel('foo', 'bar').get(0), el.get(0), 'jQuery helper returns the element');
                equal(el.viewModel('foo'), 'bar', 'jQuery helper with two arguments sets the property');
            }
        });
        test('can.viewModel backwards compatible with can.scope', function () {
            equal(can.viewModel, can.scope, 'can helper');
            if (window.$ && $.fn) {
                equal($.scope, $.viewModel, 'jQuery helper');
            }
        });
        test('can.viewModel creates one if it doesn\'t exist', function () {
            var frag = can.stache('<div id=\'me\'></div>')();
            var el = can.$(frag.firstChild);
            var viewModel = can.viewModel(el);
            ok(!!viewModel, 'viewModel created where it didn\'t exist.');
            equal(viewModel, can.data(el, 'viewModel'), 'viewModel is in the data.');
        });
        test('setting passed variables - two way binding', function () {
            can.Component.extend({
                tag: 'my-toggler',
                template: can.stache('{{#if visible}}<content/>{{/if}}'),
                viewModel: {
                    visible: true,
                    show: function () {
                        this.attr('visible', true);
                    },
                    hide: function () {
                        this.attr('visible', false);
                    }
                }
            });
            can.Component.extend({
                tag: 'my-app',
                viewModel: {
                    visible: true,
                    show: function () {
                        this.attr('visible', true);
                    }
                }
            });
            var template = can.stache('<my-app>' + '{{^visible}}<button can-click="show">show</button>{{/visible}}' + '<my-toggler visible="{visible}">' + 'content' + '<button can-click="hide">hide</button>' + '</my-toggler>' + '</my-app>');
            var frag = template({});
            var myApp = frag.firstChild, buttons = myApp.getElementsByTagName('button');
            equal(buttons.length, 1, 'there is one button');
            equal(innerHTML(buttons[0]), 'hide', 'the button\'s text is hide');
            can.trigger(buttons[0], 'click');
            buttons = myApp.getElementsByTagName('button');
            equal(buttons.length, 1, 'there is one button');
            equal(innerHTML(buttons[0]), 'show', 'the button\'s text is show');
            can.trigger(buttons[0], 'click');
            buttons = myApp.getElementsByTagName('button');
            equal(buttons.length, 1, 'there is one button');
            equal(innerHTML(buttons[0]), 'hide', 'the button\'s text is hide');
        });
        test('helpers reference the correct instance (#515)', function () {
            expect(2);
            can.Component({
                tag: 'my-text',
                template: can.stache('<p>{{valueHelper}}</p>'),
                helpers: {
                    valueHelper: function () {
                        return this.attr('value');
                    }
                }
            });
            var template = can.stache('<my-text value="value1"></my-text><my-text value="value2"></my-text>');
            var frag = template({});
            equal(frag.firstChild.firstChild.firstChild.nodeValue, 'value1');
            equal(frag.lastChild.firstChild.firstChild.nodeValue, 'value2');
        });
        test('access hypenated attributes via camelCase or hypenated', function () {
            can.Component({
                tag: 'hyphen',
                viewModel: {},
                template: can.stache('<p>{{valueHelper}}</p>'),
                helpers: {
                    valueHelper: function () {
                        return this.attr('camelCase');
                    }
                }
            });
            var template = can.stache('<hyphen camel-case="value1"></hyphen>');
            var frag = template({});
            equal(frag.firstChild.firstChild.firstChild.nodeValue, 'value1');
        });
        test('a map as viewModel', function () {
            var me = new can.Map({ name: 'Justin' });
            can.Component.extend({
                tag: 'my-viewmodel',
                template: can.stache('{{name}}}'),
                viewModel: me
            });
            var template = can.stache('<my-viewmodel></my-viewmodel>');
            equal(template().firstChild.firstChild.nodeValue, 'Justin');
        });
        test('content in a list', function () {
            var template = can.stache('<my-list>{{name}}</my-list>');
            can.Component.extend({
                tag: 'my-list',
                template: can.stache('{{#each items}}<li><content/></li>{{/each}}'),
                viewModel: {
                    items: new can.List([
                        { name: 'one' },
                        { name: 'two' }
                    ])
                }
            });
            var lis = template().firstChild.getElementsByTagName('li');
            equal(innerHTML(lis[0]), 'one', 'first li has correct content');
            equal(innerHTML(lis[1]), 'two', 'second li has correct content');
        });
        test('don\'t update computes unnecessarily', function () {
            var sourceAge = 30, timesComputeIsCalled = 0;
            var age = can.compute(function (newVal) {
                timesComputeIsCalled++;
                if (timesComputeIsCalled === 1) {
                    ok(true, 'reading initial value to set as years');
                } else if (timesComputeIsCalled === 2) {
                    equal(newVal, 31, 'updating value to 31');
                } else if (timesComputeIsCalled === 3) {
                    ok(true, 'called back another time after set to get the value');
                } else {
                    ok(false, 'You\'ve called the callback ' + timesComputeIsCalled + ' times');
                }
                if (arguments.length) {
                    sourceAge = newVal;
                } else {
                    return sourceAge;
                }
            });
            can.Component.extend({ tag: 'age-er' });
            var template = can.stache('<age-er years=\'{age}\'></age-er>');
            template({ age: age });
            age(31);
        });
        test('component does not respect can.compute passed via attributes (#540)', function () {
            var data = { compute: can.compute(30) };
            can.Component.extend({
                tag: 'my-component',
                template: can.stache('<span>{{blocks}}</span>')
            });
            var template = can.stache('<my-component blocks=\'{compute}\'></my-component>');
            var frag = template(data);
            equal(innerHTML(frag.firstChild.firstChild), '30');
        });
        test('defined view models (#563)', function () {
            var HelloWorldModel = can.Map.extend({
                visible: true,
                toggle: function () {
                    this.attr('visible', !this.attr('visible'));
                }
            });
            can.Component.extend({
                tag: 'my-helloworld',
                template: can.stache('<h1>{{#if visible}}visible{{else}}invisible{{/if}}</h1>'),
                viewModel: HelloWorldModel
            });
            var template = can.stache('<my-helloworld></my-helloworld>');
            var frag = template({});
            equal(innerHTML(frag.firstChild.firstChild), 'visible');
        });
        test('viewModel not rebound correctly (#550)', function () {
            var nameChanges = 0;
            can.Component.extend({
                tag: 'viewmodel-rebinder',
                events: {
                    '{name} change': function () {
                        nameChanges++;
                    }
                }
            });
            var template = can.stache('<viewmodel-rebinder></viewmodel-rebinder>');
            var frag = template();
            var viewModel = can.viewModel(can.$(frag.firstChild));
            var n1 = can.compute(), n2 = can.compute();
            viewModel.attr('name', n1);
            n1('updated');
            viewModel.attr('name', n2);
            n2('updated');
            equal(nameChanges, 2);
        });
        test('content extension stack overflow error', function () {
            can.Component({
                tag: 'outer-tag',
                template: can.stache('<inner-tag>inner-tag CONTENT <content/></inner-tag>')
            });
            can.Component({
                tag: 'inner-tag',
                template: can.stache('inner-tag TEMPLATE <content/>')
            });
            var template = can.stache('<outer-tag>outer-tag CONTENT</outer-tag>');
            var frag = template();
            equal(innerHTML(frag.firstChild.firstChild), 'inner-tag TEMPLATE inner-tag CONTENT outer-tag CONTENT');
        });
        test('inserted event fires twice if component inside live binding block', function () {
            var inited = 0, inserted = 0;
            can.Component({
                tag: 'child-tag',
                viewModel: {
                    init: function () {
                        inited++;
                    }
                },
                events: {
                    ' inserted': function () {
                        inserted++;
                    }
                }
            });
            can.Component({
                tag: 'parent-tag',
                template: can.stache('{{#shown}}<child-tag></child-tag>{{/shown}}'),
                viewModel: { shown: false },
                events: {
                    ' inserted': function () {
                        this.viewModel.attr('shown', true);
                    }
                }
            });
            var frag = can.stache('<parent-tag></parent-tag>')({});
            can.append(this.$fixture, frag);
            equal(inited, 1);
            equal(inserted, 1);
        });
        test('@ keeps properties live now', function () {
            can.Component.extend({
                tag: 'attr-fun',
                template: can.stache('<h1>{{fullName}}</h1>'),
                viewModel: {
                    fullName: function () {
                        return this.attr('firstName') + ' ' + this.attr('lastName');
                    }
                }
            });
            var frag = can.stache('<attr-fun first-name=\'Justin\' last-name=\'Meyer\'></attr-fun>')();
            var attrFun = frag.firstChild;
            this.fixture.appendChild(attrFun);
            equal(innerHTML(attrFun.firstChild), 'Justin Meyer');
            can.attr.set(attrFun, 'first-name', 'Brian');
            stop();
            setTimeout(function () {
                equal(attrFun.firstChild.firstChild.nodeValue, 'Brian Meyer');
                start();
            }, 100);
        });
        test('id, class, and dataViewId should be ignored (#694)', function () {
            can.Component.extend({
                tag: 'stay-classy',
                viewModel: {
                    notid: 'foo',
                    notclass: 5,
                    notdataviewid: {}
                }
            });
            var data = {
                idFromData: 'id-success',
                classFromData: 'class-success',
                dviFromData: 'dvi-success'
            };
            var frag = can.stache('<stay-classy id=\'an-id\' notid=\'{idFromData}\'' + ' class=\'a-class\' notclass=\'{classFromData}\'' + ' notdataviewid=\'{dviFromData}\'></stay-classy>')(data);
            var stayClassy = frag.firstChild;
            can.append(this.$fixture, frag);
            var viewModel = can.viewModel(stayClassy);
            equal(viewModel.attr('id'), undefined);
            equal(viewModel.attr('notid'), 'id-success');
            equal(viewModel.attr('class'), undefined);
            equal(viewModel.attr('notclass'), 'class-success');
            equal(viewModel.attr('dataViewId'), undefined);
            equal(viewModel.attr('notdataviewid'), 'dvi-success');
        });
        test('Component can-click method should be not called while component\'s init', function () {
            var called = false;
            can.Component.extend({ tag: 'child-tag' });
            can.Component.extend({
                tag: 'parent-tag',
                template: can.stache('<child-tag can-click="method"></child-tag>'),
                viewModel: {
                    method: function () {
                        called = true;
                    }
                }
            });
            can.stache('<parent-tag></parent-tag>')();
            equal(called, false);
        });
        test('Same component tag nested', function () {
            can.Component({
                'tag': 'my-tag',
                template: can.stache('<p><content/></p>')
            });
            var template = can.stache('<div><my-tag>Outter<my-tag>Inner</my-tag></my-tag></div>');
            var template2 = can.stache('<div><my-tag>3<my-tag>2<my-tag>1<my-tag>0</my-tag></my-tag></my-tag></my-tag></div>');
            var template3 = can.stache('<div><my-tag>First</my-tag><my-tag>Second</my-tag></div>');
            equal(template({}).firstChild.getElementsByTagName('p').length, 2, 'proper number of p tags');
            equal(template2({}).firstChild.getElementsByTagName('p').length, 4, 'proper number of p tags');
            equal(template3({}).firstChild.getElementsByTagName('p').length, 2, 'proper number of p tags');
        });
        test('Component events bind to window', function () {
            window.tempMap = new can.Map();
            can.Component.extend({
                tag: 'window-events',
                events: {
                    '{tempMap} prop': function () {
                        ok(true, 'called templated event');
                    }
                }
            });
            var template = can.stache('<window-events></window-events>');
            template();
            window.tempMap.attr('prop', 'value');
            window.tempMap = undefined;
            try {
                delete window.tempMap;
            } catch (e) {
            }
        });
        test('can.Construct are passed normally', function () {
            var Constructed = can.Construct.extend({ foo: 'bar' }, {});
            can.Component.extend({
                tag: 'con-struct',
                template: can.stache('{{con.foo}}')
            });
            var stached = can.stache('<con-struct con=\'{Constructed}\'></con-struct>');
            var res = stached({ Constructed: Constructed });
            equal(innerHTML(res.firstChild), 'bar');
        });
        test('stache conditionally nested components calls inserted once (#967)', function () {
            expect(1);
            can.Component.extend({
                tag: 'can-parent-stache',
                viewModel: { shown: true },
                template: can.stache('{{#if shown}}<can-child></can-child>{{/if}}')
            });
            can.Component.extend({
                tag: 'can-child',
                events: {
                    inserted: function () {
                        this.viewModel.attr('bar', 'foo');
                        ok(true, 'called inserted once');
                    }
                }
            });
            var template = can.stache('<can-parent-stache></can-parent-stache>');
            can.append(this.$fixture, template());
        });
        test('hyphen-less tag names', function () {
            var template = can.stache('<span></span><foobar></foobar>');
            can.Component.extend({
                tag: 'foobar',
                template: can.stache('<div>{{name}}</div>'),
                viewModel: { name: 'Brian' }
            });
            equal(template().lastChild.firstChild.firstChild.nodeValue, 'Brian');
        });
        test('nested component within an #if is not live bound(#1025)', function () {
            can.Component.extend({
                tag: 'parent-component',
                template: can.stache('{{#if shown}}<child-component></child-component>{{/if}}'),
                viewModel: { shown: false }
            });
            can.Component.extend({
                tag: 'child-component',
                template: can.stache('Hello world.')
            });
            var template = can.stache('<parent-component></parent-component>');
            var frag = template({});
            equal(innerHTML(frag.firstChild), '', 'child component is not inserted');
            can.viewModel(frag.firstChild).attr('shown', true);
            equal(innerHTML(frag.firstChild.firstChild), 'Hello world.', 'child component is inserted');
            can.viewModel(frag.firstChild).attr('shown', false);
            equal(innerHTML(frag.firstChild), '', 'child component is removed');
        });
        test('component does not update viewModel on id, class, and data-view-id attribute changes (#1079)', function () {
            can.Component.extend({ tag: 'x-app' });
            var frag = can.stache('<x-app></x-app>')({});
            var el = frag.firstChild;
            var viewModel = can.viewModel(el);
            can.append(this.$fixture, frag);
            can.addClass(can.$(el), 'foo');
            stop();
            setTimeout(function () {
                equal(viewModel.attr('class'), undefined, 'the viewModel is not updated when the class attribute changes');
                start();
            }, 20);
        });
        test('viewModel objects with Constructor functions as properties do not get converted (#1261)', 1, function () {
            stop();
            var Test = can.Map.extend({ test: 'Yeah' });
            can.Component.extend({
                tag: 'my-app',
                viewModel: { MyConstruct: Test },
                events: {
                    '{MyConstruct} something': function () {
                        ok(true, 'Event got triggered');
                        start();
                    }
                }
            });
            var frag = can.stache('<my-app></my-app>')();
            can.append(this.$fixture, frag);
            can.trigger(Test, 'something');
        });
        test('removing bound viewModel properties on destroy #1415', function () {
            var state = new can.Map({
                product: {
                    id: 1,
                    name: 'Tom'
                }
            });
            can.Component.extend({
                tag: 'destroyable-component',
                events: {
                    destroy: function () {
                        this.viewModel.attr('product', null);
                    }
                }
            });
            var frag = can.stache('<destroyable-component product="{product}"></destroyable-component>')(state);
            can.append(this.$fixture, frag);
            can.remove(can.$(this.fixture.firstChild));
            ok(state.attr('product') == null, 'product was removed');
        });
        test('changing viewModel property rebinds {viewModel.<...>} events (#1529)', 2, function () {
            can.Component.extend({
                tag: 'rebind-viewmodel',
                events: {
                    inserted: function () {
                        this.viewModel.attr('item', {});
                    },
                    '{scope.item} change': function () {
                        ok(true, 'Change event on scope');
                    },
                    '{viewModel.item} change': function () {
                        ok(true, 'Change event on viewModel');
                    }
                }
            });
            var frag = can.stache('<rebind-viewmodel></rebind-viewmodel>')();
            var rebind = frag.firstChild;
            can.append(this.$fixture, rebind);
            can.viewModel(can.$(rebind)).attr('item.name', 'CDN');
        });
        test('Component two way binding loop (#1579)', function () {
            var changeCount = 0;
            can.Component.extend({ tag: 'product-swatch-color' });
            can.Component.extend({
                tag: 'product-swatch',
                template: can.stache('<product-swatch-color variations="{variations}"></product-swatch-color>'),
                viewModel: can.Map.extend({
                    define: {
                        variations: {
                            set: function (variations) {
                                if (changeCount > 500) {
                                    return;
                                }
                                changeCount++;
                                return new can.List(variations.attr());
                            }
                        }
                    }
                })
            });
            var frag = can.stache('<product-swatch></product-swatch>')(), productSwatch = frag.firstChild;
            can.batch.start();
            can.viewModel(can.$(productSwatch)).attr('variations', new can.List());
            can.batch.stop();
            ok(changeCount < 500, 'more than 500 events');
        });
        test('DOM trees not releasing when referencing can.Map inside can.Map in template (#1593)', function () {
            var baseTemplate = can.stache('{{#if show}}<my-outside></my-outside>{{/if}}'), show = can.compute(true), state = new can.Map({ inner: 1 });
            var removeCount = 0;
            can.Component.extend({
                tag: 'my-inside',
                events: {
                    removed: function () {
                        removeCount++;
                    }
                }
            });
            can.Component.extend({
                tag: 'my-outside',
                template: can.stache('{{#if state.inner}}<my-inside></my-inside>{{/if}}')
            });
            can.append(this.$fixture, baseTemplate({
                show: show,
                state: state
            }));
            show(false);
            state.removeAttr('inner');
            equal(removeCount, 1, 'internal removed once');
            show(true);
            state.attr('inner', 2);
            state.removeAttr('inner');
            equal(removeCount, 2, 'internal removed twice');
        });
        test('component viewModels are initialized with binding values', function () {
            can.Component.extend({
                tag: 'init-viewmodel',
                viewModel: {
                    init: function (props) {
                        equal(props.prop, 'value', 'got initialized with a value');
                    }
                }
            });
            can.stache('<init-viewmodel {prop}=\'passedProp\'/>')({ passedProp: 'value' });
        });
        test('wrong context inside <content> tags (#2092)', function () {
            can.Component.extend({
                tag: 'some-context',
                viewModel: {
                    value: 'WRONG',
                    items: [
                        {
                            value: 'A',
                            name: 'X'
                        },
                        {
                            value: 'B',
                            name: 'Y'
                        }
                    ]
                },
                template: can.stache('{{#each items}}<content><span>{{name}}</span></content>{{/each}}')
            });
            var templateA = can.stache('<some-context><span>{{value}}</span></some-context>');
            var frag = templateA({});
            var spans = frag.firstChild.getElementsByTagName('span');
            equal(spans[0].firstChild.nodeValue, 'A', 'context is right');
            equal(spans[1].firstChild.nodeValue, 'B', 'context is right');
            var templateB = can.stache('<some-context/>');
            frag = templateB({});
            spans = frag.firstChild.getElementsByTagName('span');
            equal(spans[0].firstChild.nodeValue, 'X', 'context is right X');
            equal(spans[1].firstChild.nodeValue, 'Y', 'context is right');
        });
        test('%root property should not be serialized inside prototype of can.Component constructor (#2080)', function () {
            var viewModel = can.Map.extend({});
            can.Component.extend({
                tag: 'foo',
                viewModel: viewModel,
                init: function () {
                    ok(!this.viewModel.serialize()['%root'], 'serialized viewModel contains \'%root\' property');
                }
            });
            var template = can.stache('<foo/>');
            can.append(this.$fixture, template());
        });
        test('%root property is available in a viewModel', function () {
            var viewModel = can.Map.extend({});
            can.Component.extend({
                tag: 'foo',
                viewModel: viewModel,
                init: function () {
                    ok(this.viewModel.attr('%root'), 'viewModel contains \'%root\' property');
                }
            });
            var template = can.stache('<foo/>');
            can.append(this.$fixture, template());
        });
        test('Type in a component\u2019s viewModel doesn\u2019t work correctly with lists (#2250)', function () {
            var Item = can.Map.extend({ define: { prop: { value: true } } });
            var Collection = can.List.extend({ Map: Item }, {});
            can.Component.extend({
                tag: 'test-component',
                viewModel: {
                    define: {
                        collection: { Type: Collection },
                        vmProp: {
                            get: function () {
                                return this.attr('collection.0.prop');
                            }
                        }
                    }
                }
            });
            var frag = can.stache('<test-component collection="{collection}"></test-component>')({ collection: [{}] });
            var vmPropVal = can.viewModel(can.$(frag.firstChild)).attr('vmProp');
            ok(vmPropVal, 'value is from defined prop');
        });
    }
    makeTest('can/component dom', document);
    if (window.jQuery && window.steal) {
        makeTest('can/component vdom', simpleDocument);
    }
    QUnit.module('can/component stache');
    asyncTest('stache integration', function () {
        can.Component.extend({
            tag: 'my-tagged',
            template: '{{p1}},{{p2.val}},{{p3}},{{p4}}'
        });
        var stache = can.stache('<my-tagged p1=\'v1\' p2=\'{v2}\' p3=\'{{v3}}\'></my-tagged>');
        var data = new can.Map({
            v1: 'value1',
            v2: { val: 'value2' },
            v3: 'value3',
            value3: 'value 3',
            VALUE3: 'VALUE 3'
        });
        var stacheFrag = stache(data), stacheResult = stacheFrag.childNodes[0].innerHTML.split(',');
        equal(stacheResult[0], 'v1', 'stache uses attribute values');
        equal(stacheResult[1], 'value2', 'stache single {} cross binds value');
        equal(stacheResult[2], 'value3', 'stache  {{}} cross binds attribute');
        data.attr('v1', 'VALUE1');
        data.attr('v2', new can.Map({ val: 'VALUE 2' }));
        data.attr('v3', 'VALUE3');
        can.attr.set(stacheFrag.childNodes[0], 'p4', 'value4');
        stacheResult = stacheFrag.childNodes[0].innerHTML.split(',');
        equal(stacheResult[0], 'v1', 'stache uses attribute values so it should not change');
        equal(stacheResult[1], 'VALUE 2', 'stache single {} cross binds value and updates immediately');
        equal(stacheResult[2], 'value3', 'stache {{}} cross binds attribute changes so it wont be updated immediately');
        setTimeout(function () {
            stacheResult = stacheFrag.childNodes[0].innerHTML.split(',');
            equal(stacheResult[2], 'VALUE3', 'stache  {{}} cross binds attribute');
            equal(stacheResult[3], 'value4', 'stache sees new attributes');
            start();
        }, 20);
    });
    test('attach events on init', function () {
        expect(2);
        can.Component.extend({
            tag: 'app-foo',
            template: can.stache('<div>click me</div>'),
            events: {
                init: function () {
                    this.on('div', 'click', 'doSomethingfromInit');
                },
                inserted: function () {
                    this.on('div', 'click', 'doSomethingfromInserted');
                },
                doSomethingfromInserted: function () {
                    ok(true, 'bound in inserted');
                },
                doSomethingfromInit: function () {
                    ok(true, 'bound in init');
                }
            }
        });
        can.append(can.$('#qunit-fixture'), can.stache('<app-foo></app-foo>')({}));
        can.trigger(can.$('#qunit-fixture div'), 'click');
    });
    test('attach events on init', function () {
        expect(2);
        can.Component.extend({
            tag: 'app-foo',
            template: can.stache('<div>click me</div>'),
            events: {
                init: function () {
                    this.on('div', 'click', 'doSomethingfromInit');
                },
                inserted: function () {
                    this.on('div', 'click', 'doSomethingfromInserted');
                },
                doSomethingfromInserted: function () {
                    ok(true, 'bound in inserted');
                },
                doSomethingfromInit: function () {
                    ok(true, 'bound in init');
                }
            }
        });
        can.append(can.$('#qunit-fixture'), can.stache('<app-foo></app-foo>')({}));
        can.trigger(can.$('#qunit-fixture div'), 'click');
    });
    if (can.isFunction(Object.keys)) {
        test('<content> node list cleans up properly as direct child (#1625, #1627)', 2, function () {
            var size = Object.keys(can.view.nodeLists.nodeMap).length;
            var items = [];
            var viewModel = new can.Map({ show: false });
            var toggle = function () {
                viewModel.attr('show', !viewModel.attr('show'));
            };
            for (var i = 0; i < 100; i++) {
                items.push({ name: Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5) });
            }
            can.Component.extend({
                tag: 'grandparent-component',
                template: can.stache('{{#if show}}<parent-component></parent-component>{{/if}}'),
                scope: viewModel
            });
            can.Component.extend({
                tag: 'parent-component',
                template: can.stache('{{#items}}<child-component>\n:)\n</child-component>{{/items}}'),
                scope: { items: items }
            });
            can.Component.extend({
                tag: 'child-component',
                template: can.stache('<div>\n<content/>\n</div>')
            });
            can.append(can.$('#qunit-fixture'), can.stache('<grandparent-component></grandparent-component>')());
            toggle();
            equal(Object.keys(can.view.nodeLists.nodeMap).length - size, 0, 'No new items added to nodeMap');
            toggle();
            equal(Object.keys(can.view.nodeLists.nodeMap).length - size, 0, 'No new items added to nodeMap');
            can.remove(can.$('#qunit-fixture>*'));
        });
        asyncTest('<content> node list cleans up properly, directly nested (#1625, #1627)', function () {
            can.Component.extend({
                tag: 'parent-component',
                template: can.stache('{{#items}}<child-component>{{parentAttrInContent}}</child-component>{{/items}}'),
                scope: {
                    items: [
                        { parentAttrInContent: 0 },
                        { parentAttrInContent: 1 }
                    ]
                }
            });
            can.Component.extend({
                tag: 'child-component',
                template: can.stache('<div>{{#if bar}}<content/>{{/if}}</div>'),
                scope: { bar: true }
            });
            can.append(can.$('#qunit-fixture'), can.stache('<parent-component/>')());
            var old = can.unbindAndTeardown;
            var count = 0;
            can.unbindAndTeardown = function (name) {
                if (name === 'parentAttrInContent') {
                    count++;
                }
                return old.call(this, arguments);
            };
            can.remove(can.$('#qunit-fixture>*'));
            setTimeout(function () {
                equal(count, 2, '2 items unbound. Previously, this would unbind 4 times because of switching to fast path');
                can.unbindAndTeardown = old;
                start();
            }, 20);
        });
        test('components control destroy method is called', function () {
            expect(0);
            can.Component.extend({
                tag: 'comp-control-destroy-test',
                template: can.stache('<div>click me</div>'),
                events: {
                    '{document} click': function () {
                        ok(true, 'click registered');
                    }
                }
            });
            can.append(can.$('#qunit-fixture'), can.stache('<comp-control-destroy-test></comp-control-destroy-test>')({}));
            can.remove(can.$('#qunit-fixture>*'));
            can.trigger(can.$(document), 'click');
        });
        test('<content> tag doesn\'t leak memory', function () {
            can.Component.extend({
                tag: 'my-viewer',
                template: can.stache('<div><content /></div>')
            });
            var template = can.stache('{{#show}}<my-viewer>{{value}}</my-viewer>{{/show}}');
            var map = new can.Map({
                show: true,
                value: 'hi'
            });
            can.append(can.$('#qunit-fixture'), template(map));
            map.attr('show', false);
            map.attr('show', true);
            map.attr('show', false);
            map.attr('show', true);
            map.attr('show', false);
            map.attr('show', true);
            map.attr('show', false);
            stop();
            setTimeout(function () {
                equal(map._bindings, 1, 'only one binding');
                can.remove(can.$('#qunit-fixture>*'));
                start();
            }, 10);
        });
    }
    test('component simpleHelpers', function () {
        can.Component.extend({
            tag: 'simple-helper',
            template: can.stache('Result: {{add first second}}'),
            scope: {
                first: 4,
                second: 3
            },
            simpleHelpers: {
                add: function (a, b) {
                    return a + b;
                }
            }
        });
        var frag = can.stache('<simple-helper></simple-helper>')();
        equal(frag.childNodes[0].innerHTML, 'Result: 7');
    });
    test('component destroy should teardown event handlers', function () {
        var count = 0, map = new can.Map({ value: 1 });
        can.Component.extend({
            tag: 'page-element',
            viewModel: { map: map },
            events: {
                '{scope.map} value': function () {
                    count++;
                }
            }
        });
        can.append(can.$('#qunit-fixture'), can.stache('<page-element></page-element>')());
        can.remove(can.$('#qunit-fixture>*'));
        map.attr('value', 2);
        equal(count, 0, 'Event handler should NOT be called since the element was removed.');
        can.remove(can.$('#qunit-fixture>*'));
    });
});
/*construct/construct_test*/
define('can/construct/construct_test', function (require, exports, module) {
    require('steal-qunit');
    require('can/construct/construct');
    QUnit.module('can/construct', {
        setup: function () {
            var Animal = this.Animal = can.Construct({
                count: 0,
                test: function () {
                    return this.match ? true : false;
                }
            }, {
                init: function () {
                    this.constructor.count++;
                    this.eyes = false;
                }
            });
            var Dog = this.Dog = this.Animal({ match: /abc/ }, {
                init: function () {
                    Animal.prototype.init.apply(this, arguments);
                },
                talk: function () {
                    return 'Woof';
                }
            });
            this.Ajax = this.Dog({ count: 0 }, {
                init: function (hairs) {
                    Dog.prototype.init.apply(this, arguments);
                    this.hairs = hairs;
                    this.setEyes();
                },
                setEyes: function () {
                    this.eyes = true;
                }
            });
        }
    });
    test('inherit', function () {
        var Base = can.Construct({});
        ok(new Base() instanceof can.Construct);
        var Inherit = Base({});
        ok(new Inherit() instanceof Base);
    });
    test('Creating', function () {
        new this.Dog();
        var a1 = new this.Animal();
        new this.Animal();
        var ajax = new this.Ajax(1000);
        equal(2, this.Animal.count, 'right number of animals');
        equal(1, this.Dog.count, 'right number of animals');
        ok(this.Dog.match, 'right number of animals');
        ok(!this.Animal.match, 'right number of animals');
        ok(this.Dog.test(), 'right number of animals');
        ok(!this.Animal.test(), 'right number of animals');
        equal(1, this.Ajax.count, 'right number of animals');
        equal(2, this.Animal.count, 'right number of animals');
        equal(true, ajax.eyes, 'right number of animals');
        equal(1000, ajax.hairs, 'right number of animals');
        ok(a1 instanceof this.Animal);
        ok(a1 instanceof can.Construct);
    });
    test('new instance', function () {
        var d = this.Ajax.newInstance(6);
        equal(6, d.hairs);
    });
    test('namespaces', function () {
        var fb = can.Construct.extend('Foo.Bar');
        can.Construct('Todo', {}, {});
        ok(Foo.Bar === fb, 'returns class');
        equal(fb.shortName, 'Bar', 'short name is right');
        equal(fb.fullName, 'Foo.Bar', 'fullName is right');
    });
    test('setups', function () {
        var order = 0, staticSetup, staticSetupArgs, staticInit, staticInitArgs, protoSetup, protoInitArgs, protoInit, staticProps = {
                setup: function () {
                    staticSetup = ++order;
                    staticSetupArgs = arguments;
                    return ['something'];
                },
                init: function () {
                    staticInit = ++order;
                    staticInitArgs = arguments;
                }
            }, protoProps = {
                setup: function (name) {
                    protoSetup = ++order;
                    return ['Ford: ' + name];
                },
                init: function () {
                    protoInit = ++order;
                    protoInitArgs = arguments;
                }
            };
        can.Construct.extend('Car', staticProps, protoProps);
        new Car('geo');
        equal(staticSetup, 1);
        equal(staticInit, 2);
        equal(protoSetup, 3);
        equal(protoInit, 4);
        deepEqual(can.makeArray(staticInitArgs), ['something']);
        deepEqual(can.makeArray(protoInitArgs), ['Ford: geo']);
        deepEqual(can.makeArray(staticSetupArgs), [
            can.Construct,
            'Car',
            staticProps,
            protoProps
        ], 'static construct');
        Car.extend('Truck');
        equal(staticSetup, 5, 'Static setup is called if overwriting');
    });
    test('Creating without extend', function () {
        can.Construct('Bar', {
            ok: function () {
                ok(true, 'ok called');
            }
        });
        new Bar().ok();
        Bar('Foo', {
            dude: function () {
                ok(true, 'dude called');
            }
        });
        new Foo().dude(true);
    });
    test('setup called with original arguments', function () {
        var o1 = {
            setup: function (base, arg1, arg2) {
                equal(o1, arg1, 'first argument is correct');
                equal(o2, arg2, 'second argument is correct');
            }
        };
        var o2 = {};
        can.Construct.extend(o1, o2);
    });
});
/*map/map_test*/
define('can/map/map_test', function (require, exports, module) {
    var can = require('can/util/util');
    require('can/map/map');
    require('can/compute/compute');
    require('can/list/list');
    require('steal-qunit');
    QUnit.module('can/map');
    test('Basic Map', 4, function () {
        var state = new can.Map({
            category: 5,
            productType: 4
        });
        state.bind('change', function (ev, attr, how, val, old) {
            equal(attr, 'category', 'correct change name');
            equal(how, 'set');
            equal(val, 6, 'correct');
            equal(old, 5, 'correct');
        });
        state.attr('category', 6);
        state.unbind('change');
    });
    test('Nested Map', 5, function () {
        var me = new can.Map({
            name: {
                first: 'Justin',
                last: 'Meyer'
            }
        });
        ok(me.attr('name') instanceof can.Map);
        me.bind('change', function (ev, attr, how, val, old) {
            equal(attr, 'name.first', 'correct change name');
            equal(how, 'set');
            equal(val, 'Brian', 'correct');
            equal(old, 'Justin', 'correct');
        });
        me.attr('name.first', 'Brian');
        me.unbind('change');
    });
    test('remove attr', function () {
        var state = new can.Map({
            category: 5,
            productType: 4
        });
        state.removeAttr('category');
        deepEqual(can.Map.keys(state), ['productType'], 'one property');
    });
    test('remove attr on key with dot', function () {
        var state = new can.Map({
            'key.with.dots': 12,
            productType: 4
        });
        var state2 = new can.Map({
            'key.with.dots': 4,
            key: { 'with': { someValue: 20 } }
        });
        state.removeAttr('key.with.dots');
        state2.removeAttr('key.with.someValue');
        deepEqual(can.Map.keys(state), ['productType'], 'one property');
        deepEqual(can.Map.keys(state2), [
            'key.with.dots',
            'key'
        ], 'two properties');
        deepEqual(can.Map.keys(state2.key['with']), [], 'zero properties');
    });
    test('nested event handlers are not run by changing the parent property (#280)', function () {
        var person = new can.Map({ name: { first: 'Justin' } });
        person.bind('name.first', function (ev, newName) {
            ok(false, 'name.first should never be called');
        });
        person.bind('name', function () {
            ok(true, 'name event triggered');
        });
        person.attr('name', { first: 'Hank' });
    });
    test('cyclical objects (#521)', function () {
        var foo = {};
        foo.foo = foo;
        var fooed = new can.Map(foo);
        ok(true, 'did not cause infinate recursion');
        ok(fooed.attr('foo') === fooed, 'map points to itself');
        var me = { name: 'Justin' };
        var references = {
            husband: me,
            friend: me
        };
        var ref = new can.Map(references);
        ok(ref.attr('husband') === ref.attr('friend'), 'multiple properties point to the same thing');
    });
    test('Getting attribute that is a can.compute should return the compute and not the value of the compute (#530)', function () {
        var compute = can.compute('before');
        var map = new can.Map({ time: compute });
        equal(map.time, compute, 'dot notation call of time is compute');
        equal(map.attr('time'), compute, '.attr() call of time is compute');
    });
    test('_cid add to original object', function () {
        var map = new can.Map(), obj = { 'name': 'thecountofzero' };
        map.attr('myObj', obj);
        ok(!obj._cid, '_cid not added to original object');
    });
    test('can.each used with maps', function () {
        can.each(new can.Map({ foo: 'bar' }), function (val, attr) {
            if (attr === 'foo') {
                equal(val, 'bar');
            } else {
                ok(false, 'no properties other should be called ' + attr);
            }
        });
    });
    test('can.Map serialize triggers reading (#626)', function () {
        var old = can.__observe;
        var attributesRead = [];
        var readingTriggeredForKeys = false;
        can.__observe = function (object, attribute) {
            if (attribute === '__keys') {
                readingTriggeredForKeys = true;
            } else {
                attributesRead.push(attribute);
            }
        };
        var testMap = new can.Map({
            cats: 'meow',
            dogs: 'bark'
        });
        testMap.serialize();
        ok(can.inArray('cats', attributesRead) !== -1 && can.inArray('dogs', attributesRead) !== -1, 'map serialization triggered __reading on all attributes');
        ok(readingTriggeredForKeys, 'map serialization triggered __reading for __keys');
        can.__observe = old;
    });
    test('Test top level attributes', 7, function () {
        var test = new can.Map({
            'my.enable': false,
            'my.item': true,
            'my.count': 0,
            'my.newCount': 1,
            'my': {
                'value': true,
                'nested': { 'value': 100 }
            }
        });
        equal(test.attr('my.value'), true, 'correct');
        equal(test.attr('my.nested.value'), 100, 'correct');
        ok(test.attr('my.nested') instanceof can.Map);
        equal(test.attr('my.enable'), false, 'falsey (false) value accessed correctly');
        equal(test.attr('my.item'), true, 'truthey (true) value accessed correctly');
        equal(test.attr('my.count'), 0, 'falsey (0) value accessed correctly');
        equal(test.attr('my.newCount'), 1, 'falsey (1) value accessed correctly');
    });
    test('computed properties don\'t cause memory leaks', function () {
        var computeMap = can.Map.extend({
                'name': can.compute(function () {
                    return this.attr('first') + this.attr('last');
                })
            }), handler = function () {
            }, map = new computeMap({
                first: 'Mickey',
                last: 'Mouse'
            });
        map.bind('name', handler);
        map.bind('name', handler);
        equal(map._computedAttrs.name.count, 2, '2 handlers listening to computed property');
        map.unbind('name', handler);
        map.unbind('name', handler);
        equal(map._computedAttrs.name.count, 0, '0 handlers listening to computed property');
    });
    test('serializing cycles', function () {
        var map1 = new can.Map({ name: 'map1' });
        var map2 = new can.Map({ name: 'map2' });
        map1.attr('map2', map2);
        map2.attr('map1', map1);
        var res = map1.serialize();
        equal(res.name, 'map1');
        equal(res.map2.name, 'map2');
    });
    test('Unbinding from a map with no bindings doesn\'t throw an error (#1015)', function () {
        expect(0);
        var test = new can.Map({});
        try {
            test.unbind('change');
        } catch (e) {
            ok(false, 'No error should be thrown');
        }
    });
    test('Fast dispatch event still has target and type (#1082)', 4, function () {
        var data = new can.Map({ name: 'CanJS' });
        data.bind('change', function (ev) {
            equal(ev.type, 'change');
            equal(ev.target, data);
        });
        data.bind('name', function (ev) {
            equal(ev.type, 'name');
            equal(ev.target, data);
        });
        data.attr('name', 'David');
    });
    test('map passed to Map constructor (#1166)', function () {
        var map = new can.Map({ x: 1 });
        var res = new can.Map(map);
        deepEqual(res.attr(), { x: 1 }, 'has the same properties');
    });
    test('constructor passed to scope is threated as a property (#1261)', function () {
        var Constructor = can.Construct.extend({});
        var Map = can.Map.extend({ Todo: Constructor });
        var m = new Map();
        equal(m.attr('Todo'), Constructor);
    });
    test('_bindings count maintained after calling .off() on undefined property (#1490) ', function () {
        var map = new can.Map({ test: 1 });
        map.on('test', can.noop);
        equal(map._bindings, 1, 'The number of bindings is correct');
        map.off('undefined_property');
        equal(map._bindings, 1, 'The number of bindings is still correct');
    });
    test('Should be able to get and set attribute named \'watch\' on can.Map in Firefox', function () {
        var map = new can.Map({});
        map.attr('watch');
        ok(true, 'can have attribute named \'watch\' on a can.Map instance');
    });
    test('Should be able to get and set attribute named \'unwatch\' on can.Map in Firefox', function () {
        var map = new can.Map({});
        map.attr('unwatch');
        ok(true, 'can have attribute named \'unwatch\' on a can.Map instance');
    });
    test('Creating map in compute dispatches all events properly', function () {
        expect(2);
        var source = can.compute(0);
        var c = can.compute(function () {
            var map = new can.Map();
            source();
            map.bind('foo', function () {
                ok(true);
            });
            map.attr({ foo: 'bar' });
            return map;
        });
        c.bind('change', function () {
        });
        can.batch.start();
        source(1);
        can.batch.stop();
    });
    test('should get an empty string property value correctly', function () {
        var map = new can.Map({
            foo: 'foo',
            '': 'empty string'
        });
        equal(map.attr(''), 'empty string');
    });
    test('can.Map::attr setting is observable', function () {
        expect(0);
        var c = can.compute(function () {
            return new can.Map();
        });
        c.bind('change', function () {
            ok(false, 'the compute should not be updated');
        });
        var map = c();
        map.attr('foo', 'bar');
    });
});
/*list/list_test*/
define('can/list/list_test', function (require, exports, module) {
    var can = require('can/util/util');
    require('can/list/list');
    require('can/compute/compute');
    require('steal-qunit');
    QUnit.module('can/list');
    test('list attr changes length', function () {
        var l = new can.List([
            0,
            1,
            2
        ]);
        l.attr(3, 3);
        equal(l.length, 4);
    });
    test('removeAttr on list', function () {
        var l = new can.List([
            0,
            1,
            2
        ]);
        l.removeAttr(1);
        equal(l.attr('length'), 2);
        deepEqual(l.attr(), [
            0,
            2
        ]);
    });
    test('list splice', function () {
        var l = new can.List([
                0,
                1,
                2,
                3
            ]), first = true;
        l.bind('change', function (ev, attr, how, newVals, oldVals) {
            equal(attr, '1');
            if (first) {
                equal(how, 'remove', 'removing items');
                equal(newVals, undefined, 'no new Vals');
            } else {
                deepEqual(newVals, [
                    'a',
                    'b'
                ], 'got the right newVals');
                equal(how, 'add', 'adding items');
            }
            first = false;
        });
        l.splice(1, 2, 'a', 'b');
        deepEqual(l.serialize(), [
            0,
            'a',
            'b',
            3
        ], 'serialized');
    });
    test('list pop', function () {
        var l = new can.List([
            0,
            1,
            2,
            3
        ]);
        l.bind('change', function (ev, attr, how, newVals, oldVals) {
            equal(attr, '3');
            equal(how, 'remove');
            equal(newVals, undefined);
            deepEqual(oldVals, [3]);
        });
        l.pop();
        deepEqual(l.serialize(), [
            0,
            1,
            2
        ]);
    });
    test('remove nested property in item of array map', function () {
        var state = new can.List([{ nested: true }]);
        state.bind('change', function (ev, attr, how, newVal, old) {
            equal(attr, '0.nested');
            equal(how, 'remove');
            deepEqual(old, true);
        });
        state.removeAttr('0.nested');
        equal(undefined, state.attr('0.nested'));
    });
    test('pop unbinds', function () {
        var l = new can.List([{ foo: 'bar' }]);
        var o = l.attr(0), count = 0;
        l.bind('change', function (ev, attr, how, newVal, oldVal) {
            count++;
            if (count === 1) {
                equal(attr, '0.foo', 'count is set');
            } else if (count === 2) {
                equal(how, 'remove');
                equal(attr, '0');
            } else {
                ok(false, 'called too many times');
            }
        });
        equal(o.attr('foo'), 'bar');
        o.attr('foo', 'car');
        l.pop();
        o.attr('foo', 'bad');
    });
    test('splice unbinds', function () {
        var l = new can.List([{ foo: 'bar' }]);
        var o = l.attr(0), count = 0;
        l.bind('change', function (ev, attr, how, newVal, oldVal) {
            count++;
            if (count === 1) {
                equal(attr, '0.foo', 'count is set');
            } else if (count === 2) {
                equal(how, 'remove');
                equal(attr, '0');
            } else {
                ok(false, 'called too many times');
            }
        });
        equal(o.attr('foo'), 'bar');
        o.attr('foo', 'car');
        l.splice(0, 1);
        o.attr('foo', 'bad');
    });
    test('always gets right attr even after moving array items', function () {
        var l = new can.List([{ foo: 'bar' }]);
        var o = l.attr(0);
        l.unshift('A new Value');
        l.bind('change', function (ev, attr, how) {
            equal(attr, '1.foo');
        });
        o.attr('foo', 'led you');
    });
    test('Array accessor methods', 11, function () {
        var l = new can.List([
                'a',
                'b',
                'c'
            ]), sliced = l.slice(2), joined = l.join(' | '), concatenated = l.concat([
                2,
                1
            ], new can.List([0]));
        ok(sliced instanceof can.List, 'Slice is an Observable list');
        equal(sliced.length, 1, 'Sliced off two elements');
        equal(sliced[0], 'c', 'Single element as expected');
        equal(joined, 'a | b | c', 'Joined list properly');
        ok(concatenated instanceof can.List, 'Concatenated is an Observable list');
        deepEqual(concatenated.serialize(), [
            'a',
            'b',
            'c',
            2,
            1,
            0
        ], 'List concatenated properly');
        l.forEach(function (letter, index) {
            ok(true, 'Iteration');
            if (index === 0) {
                equal(letter, 'a', 'First letter right');
            }
            if (index === 2) {
                equal(letter, 'c', 'Last letter right');
            }
        });
    });
    test('splice removes items in IE (#562)', function () {
        var l = new can.List(['a']);
        l.splice(0, 1);
        ok(!l.attr(0), 'all props are removed');
    });
    test('list sets up computed attributes (#790)', function () {
        var List = can.List.extend({
            i: can.compute(0),
            a: 0
        });
        var l = new List([1]);
        equal(l.attr('i'), 0);
        var Map = can.Map.extend({ f: can.compute(0) });
        var m = new Map();
        m.attr('f');
    });
    test('reverse triggers add/remove events (#851)', function () {
        expect(6);
        var l = new can.List([
            1,
            2,
            3
        ]);
        l.bind('change', function () {
            ok(true, 'change should be called');
        });
        l.bind('set', function () {
            ok(false, 'set should not be called');
        });
        l.bind('add', function () {
            ok(true, 'add called');
        });
        l.bind('remove', function () {
            ok(true, 'remove called');
        });
        l.bind('length', function () {
            ok(true, 'length should be called');
        });
        l.reverse();
    });
    test('filter', function () {
        var l = new can.List([
            {
                id: 1,
                name: 'John'
            },
            {
                id: 2,
                name: 'Mary'
            }
        ]);
        var filtered = l.filter(function (item) {
            return item.name === 'Mary';
        });
        notEqual(filtered._cid, l._cid, 'not same object');
        equal(filtered.length, 1, 'one item');
        equal(filtered[0].name, 'Mary', 'filter works');
    });
    test('removing expandos on lists', function () {
        var list = new can.List([
            'a',
            'b'
        ]);
        list.removeAttr('foo');
        equal(list.length, 2);
    });
    test('No Add Events if List Splice adds the same items that it is removing. (#1277, #1399)', function () {
        var list = new can.List([
            'a',
            'b'
        ]);
        list.bind('add', function () {
            ok(false, 'Add callback should not be called.');
        });
        list.bind('remove', function () {
            ok(false, 'Remove callback should not be called.');
        });
        var result = list.splice(0, 2, 'a', 'b');
        deepEqual(result, [
            'a',
            'b'
        ]);
    });
    test('add event always returns an array as the value (#998)', function () {
        var list = new can.List([]), msg;
        list.bind('add', function (ev, newElements, index) {
            deepEqual(newElements, [4], msg);
        });
        msg = 'works on push';
        list.push(4);
        list.pop();
        msg = 'works on attr()';
        list.attr(0, 4);
        list.pop();
        msg = 'works on replace()';
        list.replace([4]);
    });
    test('Setting with .attr() out of bounds of length triggers add event with leading undefineds', function () {
        var list = new can.List([1]);
        list.bind('add', function (ev, newElements, index) {
            deepEqual(newElements, [
                undefined,
                undefined,
                4
            ], 'Leading undefineds are included');
            equal(index, 1, 'Index takes into account the leading undefineds from a .attr()');
        });
        list.attr(3, 4);
    });
    test('No events should fire if removals happened on empty arrays', function () {
        var list = new can.List([]), msg;
        list.bind('remove', function (ev, removed, index) {
            ok(false, msg);
        });
        msg = 'works on pop';
        list.pop();
        msg = 'works on shift';
        list.shift();
        ok(true, 'No events were fired.');
    });
    test('setting an index out of bounds does not create an array', function () {
        expect(1);
        var l = new can.List();
        l.attr('1', 'foo');
        equal(l.attr('1'), 'foo');
    });
    test('splice with similar but less items works (#1606)', function () {
        var list = new can.List([
            'aa',
            'bb',
            'cc'
        ]);
        list.splice(0, list.length, 'aa', 'cc', 'dd');
        deepEqual(list.attr(), [
            'aa',
            'cc',
            'dd'
        ]);
        list.splice(0, list.length, 'aa', 'cc');
        deepEqual(list.attr(), [
            'aa',
            'cc'
        ]);
    });
    test('filter returns same list type (#1744)', function () {
        var ParentList = can.List.extend();
        var ChildList = ParentList.extend();
        var children = new ChildList([
            1,
            2,
            3
        ]);
        ok(children.filter(function () {
        }) instanceof ChildList);
    });
    test('reverse returns the same list instance (#1744)', function () {
        var ParentList = can.List.extend();
        var ChildList = ParentList.extend();
        var children = new ChildList([
            1,
            2,
            3
        ]);
        ok(children.reverse() === children);
    });
    test('slice and join are observable by a compute (#1884)', function () {
        expect(2);
        var list = new can.List([
            1,
            2,
            3
        ]);
        var sliced = can.compute(function () {
            return list.slice(0, 1);
        });
        var joined = can.compute(function () {
            return list.join(',');
        });
        sliced.bind('change', function (ev, newVal) {
            deepEqual(newVal.attr(), [2], 'got a new can.List');
        });
        joined.bind('change', function (ev, newVal) {
            equal(newVal, '2,3', 'joined is observable');
        });
        list.shift();
    });
    test('list is always updated with the last promise passed to replace (#2136)', function () {
        var list = new can.List();
        stop();
        list.replace(new can.Deferred(function (def) {
            setTimeout(function () {
                def.resolve(['A']);
                setTimeout(function () {
                    equal(list.attr(0), 'B', 'list set to last promise\'s value');
                    start();
                }, 10);
            }, 20);
        }));
        list.replace(new can.Deferred(function (def) {
            setTimeout(function () {
                def.resolve(['B']);
            }, 10);
        }));
    });
});
/*list/promise/promise_test*/
define('can/list/promise/promise_test', function (require, exports, module) {
    var can = require('can/util/util');
    require('can/list/promise/promise');
    require('can/compute/compute');
    require('steal-qunit');
    QUnit.module('can/list/promise');
    test('list.isResolved', function () {
        var def = new can.Deferred();
        var l = new can.List(def);
        ok(!l.isResolved(), 'deferred-list is not resolved');
        stop();
        l.done(function () {
            ok(l.isResolved(), 'it\'s resolved!');
            deepEqual(l.attr(), [
                'one',
                2
            ], 'has data');
            start();
        });
        def.resolve([
            'one',
            2
        ]);
    });
    test('list.isResolved in a compute', function () {
        var def = new can.Deferred();
        var l = new can.List(def);
        var c = can.compute(function () {
            return l.isResolved();
        });
        ok(!c(), 'not resolved');
        var callbackCount = 0;
        c.bind('change', function (ev, newVal, oldVal) {
            callbackCount++;
            if (callbackCount === 1) {
                ok(newVal, 'resolved');
                deepEqual(l.attr(), [
                    1,
                    2
                ]);
            } else if (callbackCount === 2) {
                ok(!newVal, 'not resolved');
            } else if (callbackCount === 3) {
                ok(newVal, 'resolved');
                deepEqual(l.attr(), [
                    'a',
                    'b'
                ]);
                start();
            }
        });
        stop();
        def.resolve([
            1,
            2
        ]);
        setTimeout(function () {
            var def2 = new can.Deferred();
            l.replace(def2);
            setTimeout(function () {
                def2.resolve([
                    'a',
                    'b'
                ]);
            }, 60);
        }, 60);
    });
    test('then and done are called with the list instance', function () {
        stop();
        var def = new can.Deferred();
        var l = new can.List(def);
        l.then(function (list) {
            equal(list, l, 'then is called back with the list argument');
        });
        l.done(function (list) {
            equal(list, l, 'done is called back with the list argument');
        });
        l.always(function () {
            start();
        });
        def.resolve([
            1,
            2
        ]);
    });
    test('rejecting adds a reason attr', function () {
        stop();
        var def = new can.Deferred();
        var l = new can.List(def);
        l.fail(function (reason) {
            equal(reason, 'failed!', 'got fail reason');
        });
        l.bind('reason', function (ev, newVal) {
            equal(newVal, 'failed!', 'event updated');
            start();
        });
        def.reject('failed!');
    });
    test('A list is treated like a promise', function () {
        stop();
        var def1 = new can.Deferred();
        var def2 = new can.Deferred(), def2promise = def2.promise();
        var def3 = def1.then(function () {
            return def2promise;
        });
        def3.then(function (value) {
            var returningPromisesWorks = value === 'def2';
            ok(returningPromisesWorks, 'returning a promise works');
            def1 = new can.Deferred();
            def2 = new can.Deferred();
            var list = new can.List(def2);
            def3 = def1.then(function () {
                return list;
            });
            def3.then(function (list) {
                equal(list.length, 2, 'there are 2 items in the list, the outer deferred waited on the list\'s deferred');
                start();
            });
            setTimeout(function () {
                def1.resolve();
                setTimeout(function () {
                    def2.resolve([
                        'a',
                        'b'
                    ]);
                }, 10);
            }, 10);
        });
        setTimeout(function () {
            def1.resolve();
            setTimeout(function () {
                def2.resolve('def2');
            }, 10);
        }, 10);
    });
    test('list is always updated with the last promise passed to replace (#2136)', function () {
        var list = new can.List();
        stop();
        list.replace(new can.Deferred(function (def) {
            setTimeout(function () {
                def.resolve(['A']);
                setTimeout(function () {
                    equal(list.attr(0), 'B', 'list set to last promise\'s value');
                    start();
                }, 10);
            }, 20);
        }));
        list.replace(new can.Deferred(function (def) {
            setTimeout(function () {
                def.resolve(['B']);
            }, 10);
        }));
    });
});
/*can@2.3.18#test/test*/
define('can/test/test', ['can/util/util'], function () {
    var viewCheck = /(\.stache|extensionless)$/;
    can.test = {
        fixture: function (path) {
            if (typeof steal !== 'undefined') {
                if (steal.idToUri) {
                    return steal.config('root').toString() + '/' + path;
                } else {
                    return steal.joinURIs(System.baseURL, path);
                }
            }
            if (window.require && require.toUrl && !viewCheck.test(path)) {
                return require.toUrl(path);
            }
            return path;
        },
        path: function (path, absolute) {
            if (typeof steal !== 'undefined') {
                if (steal.idToUri) {
                    return '' + steal.idToUri(steal.id('can/' + path).toString());
                } else {
                    return steal.joinURIs(System.baseURL, path);
                }
            }
            if (!absolute && window.require && require.toUrl && !viewCheck.test(path)) {
                return require.toUrl(path);
            }
            var pathIndex = window.location.href.indexOf('/test/');
            if (pathIndex) {
                return window.location.href.substring(0, pathIndex + 1) + path;
            }
            return path;
        }
    };
});
/*observe/observe_test*/
define('can/observe/observe_test', function (require, exports, module) {
    var can = require('can/util/util');
    require('can/observe/observe');
    require('can/map/map');
    require('can/list/list');
    require('can/test/test');
    require('steal-qunit');
    QUnit.module('can/observe map+list');
    test('Basic Map', 9, function () {
        var state = new can.Map({
            category: 5,
            productType: 4,
            properties: {
                brand: [],
                model: [],
                price: []
            }
        });
        var added;
        state.bind('change', function (ev, attr, how, val, old) {
            equal(attr, 'properties.brand.0', 'correct change name');
            equal(how, 'add');
            equal(val[0].attr('foo'), 'bar', 'correct');
            added = val[0];
        });
        state.attr('properties.brand').push({ foo: 'bar' });
        state.unbind('change');
        added.bind('change', function (ev, attr, how, val, old) {
            equal(attr, 'foo', 'foo property set on added');
            equal(how, 'set', 'added');
            equal(val, 'zoo', 'added');
        });
        state.bind('change', function (ev, attr, how, val, old) {
            equal(attr, 'properties.brand.0.foo');
            equal(how, 'set');
            equal(val, 'zoo');
        });
        added.attr('foo', 'zoo');
    });
    test('list attr changes length', function () {
        var l = new can.List([
            0,
            1,
            2
        ]);
        l.attr(3, 3);
        equal(l.length, 4);
    });
    test('list splice', function () {
        var l = new can.List([
                0,
                1,
                2,
                3
            ]), first = true;
        l.bind('change', function (ev, attr, how, newVals, oldVals) {
            equal(attr, '1');
            if (first) {
                equal(how, 'remove', 'removing items');
                equal(newVals, undefined, 'no new Vals');
            } else {
                deepEqual(newVals, [
                    'a',
                    'b'
                ], 'got the right newVals');
                equal(how, 'add', 'adding items');
            }
            first = false;
        });
        l.splice(1, 2, 'a', 'b');
        deepEqual(l.serialize(), [
            0,
            'a',
            'b',
            3
        ], 'serialized');
    });
    test('list pop', function () {
        var l = new can.List([
            0,
            1,
            2,
            3
        ]);
        l.bind('change', function (ev, attr, how, newVals, oldVals) {
            equal(attr, '3');
            equal(how, 'remove');
            equal(newVals, undefined);
            deepEqual(oldVals, [3]);
        });
        l.pop();
        deepEqual(l.serialize(), [
            0,
            1,
            2
        ]);
    });
    test('changing an object unbinds', 4, function () {
        var state = new can.Map({
                category: 5,
                productType: 4,
                properties: {
                    brand: [],
                    model: [],
                    price: []
                }
            }), count = 0;
        var brand = state.attr('properties.brand');
        state.bind('change', function (ev, attr, how, val, old) {
            equal(attr, 'properties.brand');
            equal(count, 0, 'count called once');
            count++;
            equal(how, 'set');
            equal(val[0], 'hi');
        });
        state.attr('properties.brand', ['hi']);
        brand.push(1, 2, 3);
    });
    test('replacing with an object that object becomes observable', function () {
        var state = new can.Map({
            properties: {
                brand: [],
                model: [],
                price: []
            }
        });
        ok(state.attr('properties').bind, 'has bind function');
        state.attr('properties', {});
        ok(state.attr('properties').bind, 'has bind function');
    });
    test('attr does not blow away old observable', function () {
        var state = new can.Map({ properties: { brand: ['gain'] } });
        var oldCid = state.attr('properties.brand')._cid;
        state.attr({ properties: { brand: [] } }, true);
        deepEqual(state.attr('properties.brand')._cid, oldCid, 'should be the same map, so that views bound to the old one get updates');
        equal(state.attr('properties.brand').length, 0, 'list should be empty');
    });
    test('sub observes respect attr remove parameter', function () {
        var bindCalled = 0, state = new can.Map({ monkey: { tail: 'brain' } });
        state.bind('change', function (ev, attr, how, newVal, old) {
            bindCalled++;
            equal(attr, 'monkey.tail');
            equal(old, 'brain');
            equal(how, 'remove');
        });
        state.attr({ monkey: {} });
        equal('brain', state.attr('monkey.tail'), 'should not remove attribute of sub map when remove param is false');
        equal(0, bindCalled, 'remove event not fired for sub map when remove param is false');
        state.attr({ monkey: {} }, true);
        equal(undefined, state.attr('monkey.tail'), 'should remove attribute of sub map when remove param is false');
        equal(1, bindCalled, 'remove event fired for sub map when remove param is false');
    });
    test('remove attr', function () {
        var state = new can.Map({
            properties: {
                brand: [],
                model: [],
                price: []
            }
        });
        state.bind('change', function (ev, attr, how, newVal, old) {
            equal(attr, 'properties');
            equal(how, 'remove');
            deepEqual(old.serialize(), {
                brand: [],
                model: [],
                price: []
            });
        });
        state.removeAttr('properties');
        equal(undefined, state.attr('properties'));
    });
    test('remove nested attr', function () {
        var state = new can.Map({ properties: { nested: true } });
        state.bind('change', function (ev, attr, how, newVal, old) {
            equal(attr, 'properties.nested');
            equal(how, 'remove');
            deepEqual(old, true);
        });
        state.removeAttr('properties.nested');
        equal(undefined, state.attr('properties.nested'));
    });
    test('remove item in nested array', function () {
        var state = new can.Map({
            array: [
                'a',
                'b'
            ]
        });
        state.bind('change', function (ev, attr, how, newVal, old) {
            equal(attr, 'array.1');
            equal(how, 'remove');
            deepEqual(old, ['b']);
        });
        state.removeAttr('array.1');
        equal(state.attr('array.length'), 1);
    });
    test('remove nested property in item of array', function () {
        var state = new can.Map({ array: [{ nested: true }] });
        state.bind('change', function (ev, attr, how, newVal, old) {
            equal(attr, 'array.0.nested');
            equal(how, 'remove');
            deepEqual(old, true);
        });
        state.removeAttr('array.0.nested');
        equal(undefined, state.attr('array.0.nested'));
    });
    test('remove nested property in item of array map', function () {
        var state = new can.List([{ nested: true }]);
        state.bind('change', function (ev, attr, how, newVal, old) {
            equal(attr, '0.nested');
            equal(how, 'remove');
            deepEqual(old, true);
        });
        state.removeAttr('0.nested');
        equal(undefined, state.attr('0.nested'));
    });
    test('attr with an object', function () {
        var state = new can.Map({
            properties: {
                foo: 'bar',
                brand: []
            }
        });
        state.bind('change', function (ev, attr, how, newVal) {
            equal(attr, 'properties.foo', 'foo has changed');
            equal(newVal, 'bad');
        });
        state.attr({
            properties: {
                foo: 'bar',
                brand: []
            }
        });
        state.attr({
            properties: {
                foo: 'bad',
                brand: []
            }
        });
        state.unbind('change');
        state.bind('change', function (ev, attr, how, newVal) {
            equal(attr, 'properties.brand.0');
            equal(how, 'add');
            deepEqual(newVal, ['bad']);
        });
        state.attr({
            properties: {
                foo: 'bad',
                brand: ['bad']
            }
        });
    });
    test('empty get', function () {
        var state = new can.Map({});
        equal(state.attr('foo.bar'), undefined);
    });
    test('attr deep array ', function () {
        var state = new can.Map({});
        var arr = [{ foo: 'bar' }], thing = { arr: arr };
        state.attr({ thing: thing }, true);
        ok(thing.arr === arr, 'thing unmolested');
    });
    test('attr semi-serialize', function () {
        var first = {
                foo: { bar: 'car' },
                arr: [
                    1,
                    2,
                    3,
                    { four: '5' }
                ]
            }, compare = {
                foo: { bar: 'car' },
                arr: [
                    1,
                    2,
                    3,
                    { four: '5' }
                ]
            };
        var res = new can.Map(first).attr();
        deepEqual(res, compare, 'test');
    });
    test('attr sends events after it is done', function () {
        var state = new can.Map({
            foo: 1,
            bar: 2
        });
        state.bind('change', function () {
            equal(state.attr('foo'), -1, 'foo set');
            equal(state.attr('bar'), -2, 'bar set');
        });
        state.attr({
            foo: -1,
            bar: -2
        });
    });
    test('direct property access', function () {
        var state = new can.Map({
            foo: 1,
            attr: 2
        });
        equal(state.foo, 1);
        equal(typeof state.attr, 'function');
    });
    test('pop unbinds', function () {
        var l = new can.List([{ foo: 'bar' }]);
        var o = l.attr(0), count = 0;
        l.bind('change', function (ev, attr, how, newVal, oldVal) {
            count++;
            if (count === 1) {
                equal(attr, '0.foo', 'count is set');
            } else if (count === 2) {
                equal(how, 'remove', 'remove event called');
                equal(attr, '0', 'remove event called with correct index');
            } else {
                ok(false, 'change handler called too many times');
            }
        });
        equal(o.attr('foo'), 'bar');
        o.attr('foo', 'car');
        l.pop();
        o.attr('foo', 'bad');
    });
    test('splice unbinds', function () {
        var l = new can.List([{ foo: 'bar' }]);
        var o = l.attr(0), count = 0;
        l.bind('change', function (ev, attr, how, newVal, oldVal) {
            count++;
            if (count === 1) {
                equal(attr, '0.foo', 'count is set');
            } else if (count === 2) {
                equal(how, 'remove');
                equal(attr, '0');
            } else {
                ok(false, 'called too many times');
            }
        });
        equal(o.attr('foo'), 'bar');
        o.attr('foo', 'car');
        l.splice(0, 1);
        o.attr('foo', 'bad');
    });
    test('always gets right attr even after moving array items', function () {
        var l = new can.List([{ foo: 'bar' }]);
        var o = l.attr(0);
        l.unshift('A new Value');
        l.bind('change', function (ev, attr, how) {
            equal(attr, '1.foo');
        });
        o.attr('foo', 'led you');
    });
    test('recursive observers do not cause stack overflow', function () {
        expect(0);
        var a = new can.Map();
        var b = new can.Map({ a: a });
        a.attr('b', b);
    });
    test('bind to specific attribute changes when an existing attribute\'s value is changed', function () {
        var paginate = new can.Map({
            offset: 100,
            limit: 100,
            count: 2000
        });
        paginate.bind('offset', function (ev, newVal, oldVal) {
            equal(newVal, 200);
            equal(oldVal, 100);
        });
        paginate.attr('offset', 200);
    });
    test('bind to specific attribute changes when an attribute is removed', 2, function () {
        var paginate = new can.Map({
            offset: 100,
            limit: 100,
            count: 2000
        });
        paginate.bind('offset', function (ev, newVal, oldVal) {
            equal(newVal, undefined);
            equal(oldVal, 100);
        });
        paginate.removeAttr('offset');
    });
    test('Array accessor methods', 11, function () {
        var l = new can.List([
                'a',
                'b',
                'c'
            ]), sliced = l.slice(2), joined = l.join(' | '), concatenated = l.concat([
                2,
                1
            ], new can.List([0]));
        ok(sliced instanceof can.List, 'Slice is an Observable list');
        equal(sliced.length, 1, 'Sliced off two elements');
        equal(sliced[0], 'c', 'Single element as expected');
        equal(joined, 'a | b | c', 'Joined list properly');
        ok(concatenated instanceof can.List, 'Concatenated is an Observable list');
        deepEqual(concatenated.serialize(), [
            'a',
            'b',
            'c',
            2,
            1,
            0
        ], 'List concatenated properly');
        l.forEach(function (letter, index) {
            ok(true, 'Iteration');
            if (index === 0) {
                equal(letter, 'a', 'First letter right');
            }
            if (index === 2) {
                equal(letter, 'c', 'Last letter right');
            }
        });
    });
    test('instantiating can.List of correct type', function () {
        var Ob = can.Map({
            getName: function () {
                return this.attr('name');
            }
        });
        var list = new Ob.List([{ name: 'Tester' }]);
        equal(list.length, 1, 'List length is correct');
        ok(list[0] instanceof can.Map, 'Initialized list item converted to can.Map');
        ok(list[0] instanceof Ob, 'Initialized list item converted to Ob');
        equal(list[0].getName(), 'Tester', 'Converted to extended Map instance, could call getName()');
        list.push({ name: 'Another test' });
        equal(list[1].getName(), 'Another test', 'Pushed item gets converted as well');
    });
    test('can.List.prototype.splice converts objects (#253)', function () {
        var Ob = can.Map({
            getAge: function () {
                return this.attr('age') + 10;
            }
        });
        var list = new Ob.List([
            {
                name: 'Tester',
                age: 23
            },
            {
                name: 'Tester 2',
                age: 44
            }
        ]);
        equal(list[0].getAge(), 33, 'Converted age');
        list.splice(1, 1, {
            name: 'Spliced',
            age: 92
        });
        equal(list[1].getAge(), 102, 'Converted age of spliced');
    });
    test('removing an already missing attribute does not cause an event', function () {
        expect(0);
        var ob = new can.Map();
        ob.bind('change', function () {
            ok(false);
        });
        ob.removeAttr('foo');
    });
    test('Only plain objects should be converted to Observes', function () {
        var ob = new can.Map();
        ob.attr('date', new Date());
        ok(ob.attr('date') instanceof Date, 'Date should not be converted');
        var selected = can.$('body');
        ob.attr('sel', selected);
        if (can.isArray(selected)) {
            ok(ob.attr('sel') instanceof can.List, 'can.$() as array converted into List');
        } else {
            equal(ob.attr('sel'), selected, 'can.$() should not be converted');
        }
        ob.attr('element', document.getElementsByTagName('body')[0]);
        equal(ob.attr('element'), document.getElementsByTagName('body')[0], 'HTMLElement should not be converted');
        ob.attr('window', window);
        equal(ob.attr('window'), window, 'Window object should not be converted');
    });
    test('bind on deep properties', function () {
        expect(2);
        var ob = new can.Map({ name: { first: 'Brian' } });
        ob.bind('name.first', function (ev, newVal, oldVal) {
            equal(newVal, 'Justin');
            equal(oldVal, 'Brian');
        });
        ob.attr('name.first', 'Justin');
    });
    test('startBatch and stopBatch and changed event', 5, function () {
        var ob = new can.Map({
                name: { first: 'Brian' },
                age: 29
            }), bothSet = false, changeCallCount = 0, changedCalled = false;
        ob.bind('change', function () {
            ok(bothSet, 'both properties are set before the changed event was called');
            ok(!changedCalled, 'changed not called yet');
            changeCallCount++;
        });
        stop();
        can.batch.start(function () {
            ok(true, 'batch callback called');
        });
        ob.attr('name.first', 'Justin');
        setTimeout(function () {
            ob.attr('age', 30);
            bothSet = true;
            can.batch.stop();
            start();
        }, 1);
    });
    test('startBatch callback', 4, function () {
        var ob = new can.Map({
                game: { name: 'Legend of Zelda' },
                hearts: 15
            }), callbackCalled = false;
        ob.bind('change', function () {
            equal(callbackCalled, false, 'startBatch callback not called yet');
        });
        can.batch.start(function () {
            ok(true, 'startBatch callback called');
            callbackCalled = true;
        });
        ob.attr('hearts', 16);
        equal(callbackCalled, false, 'startBatch callback not called yet');
        can.batch.stop();
        equal(callbackCalled, true, 'startBatch callback called');
    });
    test('nested map attr', function () {
        var person1 = new can.Map({ name: { first: 'Josh' } }), person2 = new can.Map({
                name: {
                    first: 'Justin',
                    last: 'Meyer'
                }
            }), count = 0;
        person1.bind('change', function (ev, attr, how, val, old) {
            equal(count, 0, 'change called once');
            count++;
            equal(attr, 'name');
            equal(val.attr('first'), 'Justin');
            equal(val.attr('last'), 'Meyer');
        });
        person1.attr('name', person2.attr('name'));
        person1.attr('name', person2.attr('name'));
    });
    test('Nested array conversion (#172)', 4, function () {
        var original = [
                [
                    1,
                    2
                ],
                [
                    3,
                    4
                ],
                [
                    5,
                    6
                ]
            ], list = new can.List(original);
        equal(list.length, 3, 'list length is correct');
        deepEqual(list.serialize(), original, 'Lists are the same');
        list.unshift([
            10,
            11
        ], [
            12,
            13
        ]);
        ok(list[0] instanceof can.List, 'Unshifted array converted to map list');
        deepEqual(list.serialize(), [
            [
                10,
                11
            ],
            [
                12,
                13
            ]
        ].concat(original), 'Arrays unshifted properly');
    });
    test('can.List.prototype.replace (#194)', 7, function () {
        var list = new can.List([
                'a',
                'b',
                'c'
            ]), replaceList = [
                'd',
                'e',
                'f',
                'g'
            ], dfd = new can.Deferred();
        list.bind('remove', function (ev, arr) {
            equal(arr.length, 3, 'Three elements removed');
        });
        list.bind('add', function (ev, arr) {
            equal(arr.length, 4, 'Four new elements added');
        });
        list.replace(replaceList);
        deepEqual(list.serialize(), replaceList, 'Lists are the same');
        list.unbind('remove');
        list.unbind('add');
        list.replace();
        equal(list.length, 0, 'List has been emptied');
        list.push('D');
        stop();
        list.replace(dfd);
        setTimeout(function () {
            var newList = [
                'x',
                'y'
            ];
            list.bind('remove', function (ev, arr) {
                equal(arr.length, 1, 'One element removed');
            });
            list.bind('add', function (ev, arr) {
                equal(arr.length, 2, 'Two new elements added from Deferred');
            });
            dfd.resolve(newList);
            deepEqual(list.serialize(), newList, 'Lists are the same');
            start();
        }, 100);
    });
    test('replace with a deferred that resolves to an List', function () {
        var def = new can.Deferred();
        def.resolve(new can.List([
            { name: 'foo' },
            { name: 'bar' }
        ]));
        var list = new can.List([
            { name: '1' },
            { name: '2' }
        ]);
        list.bind('length', function () {
            equal(list.length, 2, 'length is still 2');
            equal(list[0].attr('name'), 'foo', 'set to foo');
        });
        list.replace(def);
    });
    test('.attr method doesn\'t merge nested objects (#207)', function () {
        var test = new can.Map({
            a: {
                a1: 1,
                a2: 2
            },
            b: {
                b1: 1,
                b2: 2
            }
        });
        test.attr({
            a: { a2: 3 },
            b: { b1: 3 }
        });
        deepEqual(test.attr(), {
            'a': {
                'a1': 1,
                'a2': 3
            },
            'b': {
                'b1': 3,
                'b2': 2
            }
        }, 'Object merged as expected');
    });
    test('IE8 error on list setup with List (#226)', function () {
        var list = new can.List([
                'first',
                'second',
                'third'
            ]), otherList = new can.List(list);
        deepEqual(list.attr(), otherList.attr(), 'Lists are the same');
    });
    test('initialize List with a deferred', function () {
        stop();
        var def = new can.Deferred();
        var list = new can.List(def);
        list.bind('add', function (ev, items, index) {
            deepEqual(items, [
                'a',
                'b'
            ]);
            equal(index, 0);
            start();
        });
        setTimeout(function () {
            def.resolve([
                'a',
                'b'
            ]);
        }, 10);
    });
    test('triggering a event while in a batch (#291)', function () {
        expect(0);
        stop();
        var map = new can.Map();
        can.batch.start();
        can.trigger(map, 'change', 'random');
        setTimeout(function () {
            can.batch.stop();
            start();
        }, 10);
    });
    test('dot separated keys (#257, #296)', function () {
        var ob = new can.Map({
            'test.value': 'testing',
            other: { test: 'value' }
        });
        equal(ob['test.value'], 'testing', 'Set value with dot separated key properly');
        equal(ob.attr('test.value'), 'testing', 'Could retrieve value with .attr');
        equal(ob.attr('other.test'), 'value', 'Still getting dot separated value');
        ob.attr({ 'other.bla': 'othervalue' });
        equal(ob['other.bla'], 'othervalue', 'Key is not split');
        equal(ob.attr('other.bla'), 'othervalue', 'Could retrieve value with .attr');
        ob.attr('other.stuff', 'thinger');
        equal(ob.attr('other.stuff'), 'thinger', 'Set dot separated value');
        deepEqual(ob.attr('other').serialize(), {
            test: 'value',
            stuff: 'thinger'
        }, 'Object set properly');
    });
    test('cycle binding', function () {
        var first = new can.Map(), second = new can.Map();
        first.attr('second', second);
        second.attr('first', second);
        var handler = function () {
        };
        first.bind('change', handler);
        ok(first._bindings, 'has bindings');
        first.unbind('change', handler);
        ok(!first._bindings, 'bindings removed');
    });
    test('Deferreds are not converted', function () {
        var dfd = can.Deferred(), ob = new can.Map({ test: dfd });
        ok(can.isDeferred(ob.attr('test')), 'Attribute is a deferred');
        ok(!ob.attr('test')._cid, 'Does not have a _cid');
    });
    test('Setting property to undefined', function () {
        var ob = new can.Map({ 'foo': 'bar' });
        ob.attr('foo', undefined);
        equal(ob.attr('foo'), undefined, 'foo has a value.');
    });
    test('removing list items containing computes', function () {
        var list = new can.List([{
                comp: can.compute(function () {
                    return false;
                })
            }]);
        list.pop();
        equal(list.length, 0, 'list is empty');
    });
    QUnit.module('can/observe compute');
    test('Basic Compute', function () {
        var o = new can.Map({
            first: 'Justin',
            last: 'Meyer'
        });
        var prop = can.compute(function () {
            return o.attr('first') + ' ' + o.attr('last');
        });
        equal(prop(), 'Justin Meyer');
        var handler = function (ev, newVal, oldVal) {
            equal(newVal, 'Brian Meyer');
            equal(oldVal, 'Justin Meyer');
        };
        prop.bind('change', handler);
        o.attr('first', 'Brian');
        prop.unbind('change', handler);
        o.attr('first', 'Brian');
    });
    test('compute on prototype', function () {
        var Person = can.Map({
            fullName: function () {
                return this.attr('first') + ' ' + this.attr('last');
            }
        });
        var me = new Person({
            first: 'Justin',
            last: 'Meyer'
        });
        var fullName = can.compute(me.fullName, me);
        equal(fullName(), 'Justin Meyer');
        var called = 0;
        fullName.bind('change', function (ev, newVal, oldVal) {
            called++;
            equal(called, 1, 'called only once');
            equal(newVal, 'Justin Shah');
            equal(oldVal, 'Justin Meyer');
        });
        me.attr('last', 'Shah');
    });
    test('setter compute', function () {
        var project = new can.Map({ progress: 0.5 });
        var computed = can.compute(function (val) {
            if (val) {
                project.attr('progress', val / 100);
            } else {
                return parseInt(project.attr('progress') * 100, 10);
            }
        });
        equal(computed(), 50, 'the value is right');
        computed(25);
        equal(project.attr('progress'), 0.25);
        equal(computed(), 25);
        computed.bind('change', function (ev, newVal, oldVal) {
            equal(newVal, 75);
            equal(oldVal, 25);
        });
        computed(75);
    });
    test('compute a compute', function () {
        var project = new can.Map({ progress: 0.5 });
        var percent = can.compute(function (val) {
            if (val) {
                project.attr('progress', val / 100);
            } else {
                return parseInt(project.attr('progress') * 100, 10);
            }
        });
        percent.named = 'PERCENT';
        equal(percent(), 50, 'percent starts right');
        percent.bind('change', function () {
        });
        var fraction = can.compute(function (val) {
            if (val) {
                percent(parseInt(val.split('/')[0], 10));
            } else {
                return percent() + '/100';
            }
        });
        fraction.named = 'FRACTIOn';
        fraction.bind('change', function () {
        });
        equal(fraction(), '50/100', 'fraction starts right');
        percent(25);
        equal(percent(), 25);
        equal(project.attr('progress'), 0.25, 'progress updated');
        equal(fraction(), '25/100', 'fraction updated');
        fraction('15/100');
        equal(fraction(), '15/100');
        equal(project.attr('progress'), 0.15, 'progress updated');
        equal(percent(), 15, '% updated');
    });
    test('compute with a simple compute', function () {
        expect(4);
        var a = can.compute(5);
        var b = can.compute(function () {
            return a() * 2;
        });
        equal(b(), 10, 'b starts correct');
        a(3);
        equal(b(), 6, 'b updates');
        b.bind('change', function () {
            equal(b(), 24, 'b fires change');
        });
        a(12);
        equal(b(), 24, 'b updates when bound');
    });
    test('empty compute', function () {
        var c = can.compute();
        c.bind('change', function (ev, newVal, oldVal) {
            ok(oldVal === undefined, 'was undefined');
            ok(newVal === 0, 'now zero');
        });
        c(0);
    });
    test('only one update on a batchTransaction', function () {
        var person = new can.Map({
            first: 'Justin',
            last: 'Meyer'
        });
        var func = can.compute(function () {
            return person.attr('first') + ' ' + person.attr('last') + Math.random();
        });
        var callbacks = 0;
        func.bind('change', function (ev, newVal, oldVal) {
            callbacks++;
        });
        person.attr({
            first: 'Brian',
            last: 'Moschel'
        });
        equal(callbacks, 1, 'only one callback');
    });
    test('only one update on a start and end transaction', function () {
        var person = new can.Map({
                first: 'Justin',
                last: 'Meyer'
            }), age = can.compute(5);
        var func = can.compute(function (newVal, oldVal) {
            return person.attr('first') + ' ' + person.attr('last') + age() + Math.random();
        });
        var callbacks = 0;
        func.bind('change', function (ev, newVal, oldVal) {
            callbacks++;
        });
        can.batch.start();
        person.attr('first', 'Brian');
        stop();
        setTimeout(function () {
            person.attr('last', 'Moschel');
            age(12);
            can.batch.stop();
            equal(callbacks, 1, 'only one callback');
            start();
        });
    });
    test('Compute emits change events when an embbedded observe has properties added or removed', 4, function () {
        var obs = new can.Map(), compute1 = can.compute(function () {
                var txt = obs.attr('foo');
                obs.each(function (val) {
                    txt += val.toString();
                });
                return txt;
            });
        compute1.bind('change', function (ev, newVal, oldVal) {
            ok(true, 'change handler fired: ' + newVal);
        });
        obs.attr('foo', 1);
        obs.attr('bar', 2);
        obs.attr('foo', 3);
        obs.removeAttr('bar');
        obs.removeAttr('bar');
    });
    test('compute only updates once when a list\'s contents are replaced', function () {
        var list = new can.List([{ name: 'Justin' }]), computedCount = 0;
        var compute = can.compute(function () {
            computedCount++;
            list.each(function (item) {
                item.attr('name');
            });
        });
        equal(0, computedCount, 'computes are not called until their value is read');
        compute.bind('change', function (ev, newVal, oldVal) {
        });
        equal(1, computedCount, 'binding computes to store the value');
        list.replace([{ name: 'hank' }]);
        equal(2, computedCount, 'only one compute');
    });
    test('Generate computes from Observes with can.Map.prototype.compute (#203)', 6, function () {
        var obs = new can.Map({ test: 'testvalue' });
        var compute = obs.compute('test');
        ok(compute.isComputed, '`test` is computed');
        equal(compute(), 'testvalue', 'Value is as expected');
        obs.attr('test', 'observeValue');
        equal(compute(), 'observeValue', 'Value is as expected');
        compute.bind('change', function (ev, newVal) {
            equal(newVal, 'computeValue', 'new value from compute');
        });
        obs.bind('change', function (ev, name, how, newVal) {
            equal(newVal, 'computeValue', 'Got new value from compute');
        });
        compute('computeValue');
        equal(compute(), 'computeValue', 'Got updated value');
    });
    test('compute of computes', function () {
        expect(2);
        var suggestedSearch = can.compute(null), searchQuery = can.compute(''), searchText = can.compute(function () {
                var suggested = suggestedSearch();
                if (suggested) {
                    return suggested;
                } else {
                    return searchQuery();
                }
            });
        equal('', searchText(), 'inital set');
        searchText.bind('change', function (ev, newVal) {
            equal(newVal, 'food', 'food set');
        });
        searchQuery('food');
    });
    test('compute doesn\'t rebind and leak with 0 bindings', function () {
        var state = new can.Map({ foo: 'bar' });
        var computedA = 0, computedB = 0;
        var computeA = can.compute(function () {
            computedA++;
            return state.attr('foo') === 'bar';
        });
        var computeB = can.compute(function () {
            computedB++;
            return state.attr('foo') === 'bar' || 15;
        });
        function aChange(ev, newVal) {
            if (newVal) {
                computeB.bind('change.computeA', function () {
                });
            } else {
                computeB.unbind('change.computeA');
            }
        }
        computeA.bind('change', aChange);
        aChange(null, computeA());
        equal(computedA, 1, 'binding A computes the value');
        equal(computedB, 1, 'A=true, so B is bound, computing the value');
        state.attr('foo', 'baz');
        equal(computedA, 2, 'A recomputed and unbound B');
        equal(computedB, 1, 'B was unbound, so not recomputed');
        state.attr('foo', 'bar');
        equal(computedA, 3, 'A recomputed => true');
        equal(computedB, 2, 'A=true so B is rebound and recomputed');
        computeA.unbind('change', aChange);
        computeB.unbind('change.computeA');
        state.attr('foo', 'baz');
        equal(computedA, 3, 'unbound, so didn\'t recompute A');
        equal(computedB, 2, 'unbound, so didn\'t recompute B');
    });
    test('compute setter without external value', function () {
        var age = can.compute(0, function (newVal, oldVal) {
            var num = +newVal;
            if (!isNaN(num) && 0 <= num && num <= 120) {
                return num;
            } else {
                return oldVal;
            }
        });
        equal(age(), 0, 'initial value set');
        age.bind('change', function (ev, newVal, oldVal) {
            equal(5, newVal);
            age.unbind('change', this.Constructor);
        });
        age(5);
        equal(age(), 5, '5 set');
        age('invalid');
        equal(age(), 5, '5 kept');
    });
    test('compute value', function () {
        expect(9);
        var input = { value: 1 };
        var value = can.compute('', {
            get: function () {
                return input.value;
            },
            set: function (newVal) {
                input.value = newVal;
            },
            on: function (update) {
                input.onchange = update;
            },
            off: function () {
                delete input.onchange;
            }
        });
        equal(value(), 1, 'original value');
        ok(!input.onchange, 'nothing bound');
        value(2);
        equal(value(), 2, 'updated value');
        equal(input.value, 2, 'updated input.value');
        value.bind('change', function (ev, newVal, oldVal) {
            equal(newVal, 3, 'newVal');
            equal(oldVal, 2, 'oldVal');
            value.unbind('change', this.Constructor);
        });
        ok(input.onchange, 'binding to onchange');
        value(3);
        ok(!input.onchange, 'removed binding');
        equal(value(), 3);
    });
    test('compute bound to observe', function () {
        var me = new can.Map({ name: 'Justin' });
        var bind = me.bind, unbind = me.unbind, bindCount = 0;
        me.bind = function () {
            bindCount++;
            bind.apply(this, arguments);
        };
        me.unbind = function () {
            bindCount--;
            unbind.apply(this, arguments);
        };
        var name = can.compute(me, 'name');
        equal(bindCount, 0);
        equal(name(), 'Justin');
        var handler = function (ev, newVal, oldVal) {
            equal(newVal, 'Justin Meyer');
            equal(oldVal, 'Justin');
        };
        name.bind('change', handler);
        equal(bindCount, 1);
        name.unbind('change', handler);
        stop();
        setTimeout(function () {
            start();
            equal(bindCount, 0);
        }, 100);
    });
    test('binding to a compute on an observe before reading', function () {
        var me = new can.Map({ name: 'Justin' });
        var name = can.compute(me, 'name');
        var handler = function (ev, newVal, oldVal) {
            equal(newVal, 'Justin Meyer');
            equal(oldVal, 'Justin');
        };
        name.bind('change', handler);
        equal(name(), 'Justin');
    });
    test('compute bound to input value', function () {
        var input = document.createElement('input');
        input.value = 'Justin';
        var value = can.compute(input, 'value', 'change');
        equal(value(), 'Justin');
        value('Justin M.');
        equal(input.value, 'Justin M.', 'input change correctly');
        var handler = function (ev, newVal, oldVal) {
            equal(newVal, 'Justin Meyer');
            equal(oldVal, 'Justin M.');
        };
        value.bind('change', handler);
        input.value = 'Justin Meyer';
        value.unbind('change', handler);
        stop();
        setTimeout(function () {
            input.value = 'Brian Moschel';
            equal(value(), 'Brian Moschel');
            start();
        }, 50);
    });
    test('compute on the prototype', function () {
        expect(4);
        var Person = can.Map.extend({
            fullName: can.compute(function (fullName) {
                if (arguments.length) {
                    var parts = fullName.split(' ');
                    this.attr({
                        first: parts[0],
                        last: parts[1]
                    });
                } else {
                    return this.attr('first') + ' ' + this.attr('last');
                }
            })
        });
        var me = new Person();
        var fn = me.attr({
            first: 'Justin',
            last: 'Meyer'
        }).attr('fullName');
        equal(fn, 'Justin Meyer', 'can read attr');
        me.attr('fullName', 'Brian Moschel');
        equal(me.attr('first'), 'Brian', 'set first name');
        equal(me.attr('last'), 'Moschel', 'set last name');
        var handler = function (ev, newVal, oldVal) {
            ok(newVal, 'Brian M');
        };
        me.bind('fullName', handler);
        me.attr('last', 'M');
        me.unbind('fullName', handler);
        me.attr('first', 'B');
    });
    test('join is computable (#519)', function () {
        expect(2);
        var l = new can.List([
            'a',
            'b'
        ]);
        var joined = can.compute(function () {
            return l.join(',');
        });
        joined.bind('change', function (ev, newVal, oldVal) {
            equal(oldVal, 'a,b');
            equal(newVal, 'a,b,c');
        });
        l.push('c');
    });
    test('nested computes', function () {
        var data = new can.Map({});
        var compute = data.compute('summary.button');
        compute.bind('change', function () {
            ok(true, 'compute changed');
        });
        data.attr({ summary: { button: 'hey' } }, true);
    });
    test('can.each works with replacement of index (#815)', function () {
        var items = new can.List([
            'a',
            'b'
        ]);
        var value = can.compute(function () {
            var res = '';
            items.each(function (item) {
                res += item;
            });
            return res;
        });
        value.bind('change', function (ev, newValue) {
            equal(newValue, 'Ab', 'updated value');
        });
        items.attr(0, 'A');
    });
    test('When adding a property and using .each only a single update runs (#815)', function () {
        var items = new can.Map({}), computedCount = 0;
        var value = can.compute(function () {
            computedCount++;
            var res = '';
            items.each(function (item) {
                res += item;
            });
            return res;
        });
        value.bind('change', function () {
        });
        items.attr('a', 'b');
        equal(computedCount, 2, 'recalculated twice');
    });
    test('compute(obs, prop) doesn\'t read attr', function () {
        var map = new can.Map({ name: 'foo' });
        var name = can.compute(map, 'name');
        var oldAttr = map.attr;
        var count = 0;
        map.attr = function () {
            count++;
            return oldAttr.apply(this, arguments);
        };
        name.bind('change', function () {
        });
        equal(count, 1, 'attr only called once to get cached value');
        oldAttr.call(map, 'name', 'bar');
        equal(count, 1, 'attr only called once to get cached value');
    });
    test('computes in observes leak handlers (#1676)', function () {
        var handler = function () {
        };
        var person = new can.Map({
            pet: {
                type: 'dog',
                name: 'fluffy'
            }
        });
        equal(person._bindings || 0, 0, 'no bindings');
        person.attr('petInfo', can.compute(function () {
            return person.attr('pet.type') + ': ' + person.attr('pet.name');
        }));
        equal(person._bindings || 0, 0, 'After adding compute no bindings');
        person.bind('change', handler);
        equal(person._bindings, 2, 'After adding compute no bindings');
        person.unbind('change', handler);
        equal(person._bindings, 0, 'After unbinding no bindings');
    });
    test('compute bound to object property (#1719)', 4, function () {
        var obj = {};
        obj.foo = 'bar';
        var value = can.compute(obj, 'foo', 'change');
        equal(value(), 'bar', 'property retrieved correctly');
        value('baz');
        equal(obj.foo, 'baz', 'property changed correctly');
        var handler = function (ev, newVal, oldVal) {
            equal(newVal, 'qux', 'change handler newVal correct');
            equal(oldVal, 'baz', 'change handler oldVal correct');
        };
        value.bind('change', handler);
        value('qux');
        value.unbind('change', handler);
    });
    test('compute bound to nested object property (#1719)', 4, function () {
        var obj = { prop: { subprop: { foo: 'bar' } } };
        var value = can.compute(obj, 'prop.subprop.foo', 'change');
        equal(value(), 'bar', 'property retrieved correctly');
        value('baz');
        equal(obj.prop.subprop.foo, 'baz', 'property changed correctly');
        var handler = function (ev, newVal, oldVal) {
            equal(newVal, 'qux', 'change handler newVal correct');
            equal(oldVal, 'baz', 'change handler oldVal correct');
        };
        value.bind('change', handler);
        value('qux');
        value.unbind('change', handler);
    });
});
/*compute/read_test*/
define('can/compute/read_test', function (require, exports, module) {
    var can = require('can/util/util');
    require('can/compute/compute');
    require('can/map/map');
    require('steal-qunit');
    QUnit.module('can/compute/read');
    test('can.Construct derived classes should be considered objects, not functions (#450)', function () {
        var foostructor = can.Map({ text: 'bar' }, {}), obj = {
                next_level: {
                    thing: foostructor,
                    text: 'In the inner context'
                }
            }, read;
        foostructor.self = foostructor;
        read = can.compute.read(obj, can.compute.read.reads('next_level.thing.self.text'));
        equal(read.value, 'bar', 'static properties on a can.Construct-based function');
        read = can.compute.read(obj, can.compute.read.reads('next_level.thing.self'), { isArgument: true });
        ok(read.value === foostructor, 'arguments shouldn\'t be executed');
        foostructor.self = function () {
            return foostructor;
        };
        read = can.compute.read(obj, can.compute.read.reads('next_level.thing.self.text'), {});
        equal(read.value, 'bar', 'anonymous functions in the middle of a read should be executed if requested');
    });
    test('compute.read works with a Map wrapped in a compute', function () {
        var parent = can.compute(new can.Map({ map: { first: 'Justin' } }));
        var result = can.compute.read(parent, can.compute.read.reads('map.first'));
        equal(result.value, 'Justin', 'The correct value is found.');
    });
    test('compute.read works with a Map wrapped in a compute', function () {
        var parent = new can.Compute(new can.Map({ map: { first: 'Justin' } }));
        var result = can.Compute.read(parent, can.compute.read.reads('map.first'));
        equal(result.value, 'Justin', 'The correct value is found.');
    });
    test('compute.read returns constructor functions instead of executing them (#1332)', function () {
        var Todo = can.Map.extend({});
        var parent = can.compute(new can.Map({ map: { Test: Todo } }));
        var result = can.compute.read(parent, can.compute.read.reads('map.Test'));
        equal(result.value, Todo, 'Got the same Todo');
    });
    test('compute.set with different values', 4, function () {
        var comp = can.compute('David');
        var parent = {
            name: 'David',
            comp: comp
        };
        var map = new can.Map({ name: 'David' });
        map.bind('change', function (ev, attr, how, value) {
            equal(value, 'Brian', 'Got change event on map');
        });
        can.compute.set(parent, 'name', 'Matthew');
        equal(parent.name, 'Matthew', 'Name set');
        can.compute.set(parent, 'comp', 'Justin');
        equal(comp(), 'Justin', 'Name updated');
        can.compute.set(map, 'name', 'Brian');
        equal(map.attr('name'), 'Brian', 'Name updated in map');
    });
    test('can.Compute.read can read a promise (#179)', function () {
        var def = new can.Deferred();
        var map = new can.Map();
        var c = can.compute(function () {
            return can.Compute.read({ map: map }, can.compute.read.reads('map.data.value')).value;
        });
        var calls = 0;
        c.bind('change', function (ev, newVal, oldVal) {
            calls++;
            equal(calls, 1, 'only one call');
            equal(newVal, 'Something', 'new value');
            equal(oldVal, undefined, 'oldVal');
            start();
        });
        map.attr('data', def);
        setTimeout(function () {
            def.resolve('Something');
        }, 2);
        stop();
    });
    test('can.compute.reads', function () {
        deepEqual(can.compute.read.reads('@foo'), [{
                key: 'foo',
                at: true
            }]);
        deepEqual(can.compute.read.reads('@foo.bar'), [
            {
                key: 'foo',
                at: true
            },
            {
                key: 'bar',
                at: false
            }
        ]);
        deepEqual(can.compute.read.reads('@foo\\.bar'), [{
                key: 'foo.bar',
                at: true
            }]);
        deepEqual(can.compute.read.reads('foo.bar@zed'), [
            {
                key: 'foo',
                at: false
            },
            {
                key: 'bar',
                at: false
            },
            {
                key: 'zed',
                at: true
            }
        ]);
    });
    test('prototype computes work (#2098)', function () {
        var Map = can.Map.extend({
            plusOne: can.compute(function () {
                return this.attr('value') + 1;
            })
        });
        var root = new Map({ value: 2 }), read;
        read = can.compute.read(root, can.compute.read.reads('plusOne'));
        equal(read.value, 3, 'static properties on a can.Construct-based function');
    });
    test('expandos on can.Map can be read (#2199)', function () {
        var map = new can.Map({});
        var expandoMethod = function () {
            return this.expandoProp + '!';
        };
        map.expandoMethod = expandoMethod;
        map.expandoProp = 'val';
        var read = can.compute.read(map, can.compute.read.reads('@expandoMethod'));
        equal(read.value(), 'val!', 'got expando method');
        read = can.compute.read(map, can.compute.read.reads('expandoProp'));
        equal(read.value, 'val', 'got expando prop');
    });
});
/*compute/compute_test*/
define('can/compute/compute_test', function (require, exports, module) {
    var can = require('can/util/util');
    require('can/compute/compute');
    require('can/map/map');
    require('steal-qunit');
    require('can/compute/read_test');
    QUnit.module('can/compute');
    test('single value compute', function () {
        var num = can.compute(1);
        num.bind('change', function (ev, newVal, oldVal) {
            equal(newVal, 2, 'newVal');
            equal(oldVal, 1, 'oldVal');
        });
        num(2);
    });
    test('inner computes values are not bound to', function () {
        var num = can.compute(1);
        var outer = can.compute(function () {
            var inner = can.compute(function () {
                return num() + 1;
            });
            return 2 * inner();
        });
        var handler = function () {
        };
        outer.bind('change', handler);
        stop();
        setTimeout(function () {
            equal(num.computeInstance._bindings, 1, 'inner compute only bound once');
            equal(outer.computeInstance._bindings, 1, 'outer compute only bound once');
            start();
        }, 50);
    });
    test('can.compute.truthy', function () {
        var result = 0;
        var numValue;
        var num = can.compute(numValue = 3);
        var truthy = can.compute.truthy(num);
        var tester = can.compute(function () {
            if (truthy()) {
                return ++result;
            } else {
                return ++result;
            }
        });
        tester.bind('change', function (ev, newVal, oldVal) {
            if (num() === 0) {
                equal(newVal, 2, '2 is the new val');
            } else if (num() === -1) {
                equal(newVal, 3, '3 is the new val');
            } else {
                ok(false, 'change should not be called');
            }
        });
        equal(tester(), 1, 'on bind, we call tester once');
        num(numValue = 2);
        num(numValue = 1);
        num(numValue = 0);
        num(numValue = -1);
    });
    test('a binding compute does not double read', function () {
        var sourceAge = 30, timesComputeIsCalled = 0;
        var age = can.compute(function (newVal) {
            timesComputeIsCalled++;
            if (timesComputeIsCalled === 1) {
                ok(true, 'reading age to get value');
            } else if (timesComputeIsCalled === 2) {
                equal(newVal, 31, 'the second time should be an update');
            } else if (timesComputeIsCalled === 3) {
                ok(true, 'called after set to get the value');
            } else {
                ok(false, 'You\'ve called the callback ' + timesComputeIsCalled + ' times');
            }
            if (arguments.length) {
                sourceAge = newVal;
            } else {
                return sourceAge;
            }
        });
        var info = can.compute(function () {
            return 'I am ' + age();
        });
        var k = function () {
        };
        info.bind('change', k);
        equal(info(), 'I am 30');
        age(31);
        equal(info(), 'I am 31');
    });
    test('cloning a setter compute (#547)', function () {
        var name = can.compute('', function (newVal) {
            return this.txt + newVal;
        });
        var cloned = name.clone({ txt: '.' });
        cloned('-');
        equal(cloned(), '.-');
    });
    test('compute updated method uses get and old value (#732)', function () {
        expect(9);
        var input = { value: 1 };
        var value = can.compute('', {
            get: function () {
                return input.value;
            },
            set: function (newVal) {
                input.value = newVal;
            },
            on: function (update) {
                input.onchange = update;
            },
            off: function () {
                delete input.onchange;
            }
        });
        equal(value(), 1, 'original value');
        ok(!input.onchange, 'nothing bound');
        value(2);
        equal(value(), 2, 'updated value');
        equal(input.value, 2, 'updated input.value');
        value.bind('change', function (ev, newVal, oldVal) {
            equal(newVal, 3, 'newVal');
            equal(oldVal, 2, 'oldVal');
            value.unbind('change', this.Constructor);
        });
        ok(input.onchange, 'binding to onchange');
        input.value = 3;
        input.onchange({});
        ok(!input.onchange, 'removed binding');
        equal(value(), 3);
    });
    test('a compute updated by source changes within a batch is part of that batch', function () {
        var computeA = can.compute('a');
        var computeB = can.compute('b');
        var combined1 = can.compute(function () {
            return computeA() + ' ' + computeB();
        });
        var combined2 = can.compute(function () {
            return computeA() + ' ' + computeB();
        });
        var combo = can.compute(function () {
            return combined1() + ' ' + combined2();
        });
        var callbacks = 0;
        combo.bind('change', function () {
            if (callbacks === 0) {
                ok(true, 'called change once');
            } else {
                ok(false, 'called change multiple times');
            }
            callbacks++;
        });
        can.batch.start();
        computeA('A');
        computeB('B');
        can.batch.stop();
    });
    test('compute.async can be like a normal getter', function () {
        var first = can.compute('Justin'), last = can.compute('Meyer'), fullName = can.compute.async('', function () {
                return first() + ' ' + last();
            });
        equal(fullName(), 'Justin Meyer');
    });
    test('compute.async operate on single value', function () {
        var a = can.compute(1);
        var b = can.compute(2);
        var obj = can.compute.async({}, function (curVal) {
            if (a()) {
                curVal.a = a();
            } else {
                delete curVal.a;
            }
            if (b()) {
                curVal.b = b();
            } else {
                delete curVal.b;
            }
            return curVal;
        });
        obj.bind('change', function () {
        });
        deepEqual(obj(), {
            a: 1,
            b: 2
        }, 'object has all properties');
        a(0);
        deepEqual(obj(), { b: 2 }, 'removed a');
        b(0);
        deepEqual(obj(), {}, 'removed b');
    });
    test('compute.async async changing value', function () {
        var a = can.compute(1);
        var b = can.compute(2);
        var async = can.compute.async(undefined, function (curVal, setVal) {
            if (a()) {
                setTimeout(function () {
                    setVal('a');
                }, 10);
            } else if (b()) {
                setTimeout(function () {
                    setVal('b');
                }, 10);
            } else {
                return null;
            }
        });
        var changeArgs = [
                {
                    newVal: 'a',
                    oldVal: undefined,
                    run: function () {
                        a(0);
                    }
                },
                {
                    newVal: 'b',
                    oldVal: 'a',
                    run: function () {
                        b(0);
                    }
                },
                {
                    newVal: null,
                    oldVal: 'b',
                    run: function () {
                        start();
                    }
                }
            ], changeNum = 0;
        stop();
        async.bind('change', function (ev, newVal, oldVal) {
            var data = changeArgs[changeNum++];
            equal(newVal, data.newVal, 'newVal is correct');
            equal(oldVal, data.oldVal, 'oldVal is correct');
            setTimeout(data.run, 10);
        });
    });
    test('compute.async read without binding', function () {
        var source = can.compute(1);
        var async = can.compute.async([], function (curVal, setVal) {
            curVal.push(source());
            return curVal;
        });
        ok(async(), 'calling async worked');
    });
    QUnit.module('can/Compute');
    test('single value compute', function () {
        expect(2);
        var num = new can.Compute(1);
        num.bind('change', function (ev, newVal, oldVal) {
            equal(newVal, 2, 'newVal');
            equal(oldVal, 1, 'oldVal');
        });
        num.set(2);
    });
    test('inner computes values are not bound to', function () {
        var num = new can.Compute(1), numBind = num.bind, numUnbind = num.unbind;
        var bindCount = 0;
        num.bind = function () {
            bindCount++;
            return numBind.apply(this, arguments);
        };
        num.unbind = function () {
            bindCount--;
            return numUnbind.apply(this, arguments);
        };
        var outer = new can.Compute(function () {
            var inner = new can.Compute(function () {
                return num.get() + 1;
            });
            return 2 * inner.get();
        });
        var handler = function () {
        };
        outer.bind('change', handler);
        stop();
        setTimeout(function () {
            equal(bindCount, 1, 'compute only bound to once');
            start();
        }, 50);
    });
    test('can.Compute.truthy', function () {
        var result = 0;
        var num = new can.Compute(3);
        var truthy = can.Compute.truthy(num);
        var tester = new can.Compute(function () {
            if (truthy.get()) {
                return ++result;
            } else {
                return ++result;
            }
        });
        tester.bind('change', function (ev, newVal, oldVal) {
            if (num.get() === 0) {
                equal(newVal, 2, '2 is the new val');
            } else if (num.get() === -1) {
                equal(newVal, 3, '3 is the new val');
            } else {
                ok(false, 'change should not be called');
            }
        });
        equal(tester.get(), 1, 'on bind, we call tester once');
        num.set(2);
        num.set(1);
        num.set(0);
        num.set(-1);
    });
    test('a binding compute does not double read', function () {
        var sourceAge = 30, timesComputeIsCalled = 0;
        var age = new can.Compute(function (newVal) {
            timesComputeIsCalled++;
            if (timesComputeIsCalled === 1) {
                ok(true, 'reading age to get value');
            } else if (timesComputeIsCalled === 2) {
                equal(newVal, 31, 'the second time should be an update');
            } else if (timesComputeIsCalled === 3) {
                ok(true, 'called after set to get the value');
            } else {
                ok(false, 'You\'ve called the callback ' + timesComputeIsCalled + ' times');
            }
            if (arguments.length) {
                sourceAge = newVal;
            } else {
                return sourceAge;
            }
        });
        var info = new can.Compute(function () {
            return 'I am ' + age.get();
        });
        var k = function () {
        };
        info.bind('change', k);
        equal(info.get(), 'I am 30');
        age.set(31);
        equal(info.get(), 'I am 31');
    });
    test('cloning a setter compute (#547)', function () {
        var name = new can.Compute('', function (newVal) {
            return this.txt + newVal;
        });
        var cloned = name.clone({ txt: '.' });
        cloned.set('-');
        equal(cloned.get(), '.-');
    });
    test('compute updated method uses get and old value (#732)', function () {
        expect(9);
        var input = { value: 1 };
        var value = new can.Compute('', {
            get: function () {
                return input.value;
            },
            set: function (newVal) {
                input.value = newVal;
            },
            on: function (update) {
                input.onchange = update;
            },
            off: function () {
                delete input.onchange;
            }
        });
        equal(value.get(), 1, 'original value');
        ok(!input.onchange, 'nothing bound');
        value.set(2);
        equal(value.get(), 2, 'updated value');
        equal(input.value, 2, 'updated input.value');
        value.bind('change', function (ev, newVal, oldVal) {
            equal(newVal, 3, 'newVal');
            equal(oldVal, 2, 'oldVal');
            value.unbind('change', this.Constructor);
        });
        ok(input.onchange, 'binding to onchange');
        input.value = 3;
        input.onchange({});
        ok(!input.onchange, 'removed binding');
        equal(value.get(), 3);
    });
    test('a compute updated by source changes within a batch is part of that batch', function () {
        var computeA = new can.Compute('a');
        var computeB = new can.Compute('b');
        var combined1 = new can.Compute(function () {
            return computeA.get() + ' ' + computeB.get();
        });
        var combined2 = new can.Compute(function () {
            return computeA.get() + ' ' + computeB.get();
        });
        var combo = new can.Compute(function () {
            return combined1.get() + ' ' + combined2.get();
        });
        var callbacks = 0;
        combo.bind('change', function () {
            if (callbacks === 0) {
                ok(true, 'called change once');
            } else {
                ok(false, 'called change multiple times');
            }
            callbacks++;
        });
        can.batch.start();
        computeA.set('A');
        computeB.set('B');
        can.batch.stop();
    });
    test('compute.async can be like a normal getter', function () {
        var first = new can.Compute('Justin'), last = new can.Compute('Meyer'), fullName = can.Compute.async('', function () {
                return first.get() + ' ' + last.get();
            });
        equal(fullName.get(), 'Justin Meyer');
    });
    test('compute.async operate on single value', function () {
        var a = new can.Compute(1);
        var b = new can.Compute(2);
        var obj = can.Compute.async({}, function (curVal) {
            if (a.get()) {
                curVal.a = a.get();
            } else {
                delete curVal.a;
            }
            if (b.get()) {
                curVal.b = b.get();
            } else {
                delete curVal.b;
            }
            return curVal;
        });
        obj.bind('change', function () {
        });
        deepEqual(obj.get(), {
            a: 1,
            b: 2
        }, 'object has all properties');
        a.set(0);
        deepEqual(obj.get(), { b: 2 }, 'removed a');
        b.set(0);
        deepEqual(obj.get(), {}, 'removed b');
    });
    test('compute.async async changing value', function () {
        var a = new can.Compute(1);
        var b = new can.Compute(2);
        var async = can.Compute.async(undefined, function (curVal, setVal) {
            if (a.get()) {
                setTimeout(function () {
                    setVal('a');
                }, 10);
            } else if (b.get()) {
                setTimeout(function () {
                    setVal('b');
                }, 10);
            } else {
                return null;
            }
        });
        var changeArgs = [
                {
                    newVal: 'a',
                    oldVal: undefined,
                    run: function () {
                        a.set(0);
                    }
                },
                {
                    newVal: 'b',
                    oldVal: 'a',
                    run: function () {
                        b.set(0);
                    }
                },
                {
                    newVal: null,
                    oldVal: 'b',
                    run: function () {
                        start();
                    }
                }
            ], changeNum = 0;
        stop();
        async.bind('change', function (ev, newVal, oldVal) {
            var data = changeArgs[changeNum++];
            equal(newVal, data.newVal, 'newVal is correct');
            equal(oldVal, data.oldVal, 'oldVal is correct');
            setTimeout(data.run, 10);
        });
    });
    test('compute.async read without binding', function () {
        var source = new can.Compute(1);
        var async = can.Compute.async([], function (curVal, setVal) {
            curVal.push(source.get());
            return curVal;
        });
        ok(async.get(), 'calling async worked');
    });
    test('Compute.async set uses last set or initial value', function () {
        var add = new can.Compute(1);
        var fnCount = 0;
        var async = can.Compute.async(10, function (curVal) {
            switch (fnCount++) {
            case 0:
                equal(curVal, 10);
                break;
            case 1:
                equal(curVal, 20);
                break;
            case 2:
                equal(curVal, 30, 'on bind');
                break;
            case 3:
                equal(curVal, 30, 'on bind');
                break;
            }
            return curVal + add.get();
        });
        equal(async.get(), 11, 'initial value');
        async.set(20);
        async.bind('change', function () {
        });
        async.set(20);
        async.set(30);
    });
    test('setting compute.async with a observable dependency gets a new value and can re-compute', 4, function () {
        var compute = can.compute(1);
        var add;
        var async = can.compute.async(1, function (curVal) {
            add = curVal;
            return compute() + add;
        });
        equal(async(), 2, 'can read unbound');
        async.bind('change', function (ev, newVal, oldVal) {
            equal(newVal, 3, 'change new val');
            equal(oldVal, 2, 'change old val');
        });
        async(2);
        equal(async(), 3, 'can read unbound');
    });
    test('compute.async getter has correct when length === 1', function () {
        var m = new can.Map();
        var getterCompute = can.compute.async(false, function (singleArg) {
            equal(this, m, 'getter has the right context');
        }, m);
        getterCompute.bind('change', can.noop);
    });
    test('bug with nested computes and batch ordering (#1519)', function () {
        var root = can.compute('a');
        var isA = can.compute(function () {
            return root() === 'a';
        });
        var isB = can.compute(function () {
            return root() === 'b';
        });
        var combined = can.compute(function () {
            var valA = isA(), valB = isB();
            return valA || valB;
        });
        equal(combined(), true);
        combined.bind('change', function () {
        });
        can.batch.start();
        root('b');
        can.batch.stop();
        equal(combined(), true);
    });
    test('compute change handler context is set to the function not can.Compute', function () {
        var comp = can.compute(null);
        comp.bind('change', function () {
            equal(typeof this, 'function');
        });
        comp('test');
    });
    test('Calling .unbind() on un-bound compute does not throw an error', function () {
        var count = can.compute(0);
        count.unbind('change');
        ok(true, 'No error was thrown');
    });
    test('dependent computes update in the right order (2093)', function () {
        var root = can.compute('a'), childB = can.compute(function () {
                return root();
            }), combine = can.compute(function () {
                return root() + childB();
            });
        combine.bind('change', function (ev, newVal) {
            equal(newVal, 'bb', 'concat changed');
        });
        root('b');
    });
    test('dependent computes update in the right order with a batch (#2093)', function () {
        var root = can.compute('a'), child = can.compute(function () {
                return root();
            }), child2 = can.compute(function () {
                return root();
            }), grandChild = can.compute(function () {
                return child();
            }), combine = can.compute(function () {
                return child2() + grandChild();
            });
        combine.bind('change', function (ev, newVal) {
            equal(newVal, 'bb', 'concat changed');
        });
        can.batch.start();
        root('b');
        can.batch.stop();
    });
    test('bug with nested computes and batch ordering (#1519)', function () {
        var root = can.compute('a');
        var isA = can.compute(function () {
            return root() === 'a';
        });
        var isB = can.compute(function () {
            return root() === 'b';
        });
        var combined = can.compute(function () {
            var valA = isA(), valB = isB();
            return valA || valB;
        });
        equal(combined(), true);
        combined.bind('change', function () {
        });
        can.batch.start();
        root('b');
        can.batch.stop();
        equal(combined(), true);
    });
    test('binding, unbinding, and rebinding works after a timeout (#2095)', function () {
        var root = can.compute(1), derived = can.compute(function () {
                return root();
            });
        var change = function () {
        };
        derived.bind('change', change);
        derived.unbind('change', change);
        stop();
        setTimeout(function () {
            derived.bind('change', function (ev, newVal, oldVal) {
                equal(newVal, 2, 'updated');
                start();
            });
            root(2);
        }, 10);
    });
    test('can.__isRecording observes doesn\'t understand can.__notObserve (#2099)', function () {
        expect(0);
        var compute = can.compute(1);
        compute.computeInstance.bind = function () {
            ok(false);
        };
        var outer = can.compute(function () {
            can.__notObserve(function () {
                compute();
            })();
        });
        outer.bind('change', function () {
        });
    });
    test('handles missing update order items (#2121)', function () {
        var root1 = can.compute('root1'), child1 = can.compute(function () {
                return root1();
            }), root2 = can.compute('root2'), child2 = can.compute(function () {
                return root2();
            }), gc2 = can.compute(function () {
                return child2();
            }), res = can.compute(function () {
                return child1() + gc2();
            });
        res.bind('change', function (ev, newVal) {
            equal(newVal, 'ROOT1root2');
        });
        can.batch.start();
        root1('ROOT1');
        can.batch.stop();
    });
    test('compute should not fire event when NaN is set multiple times #2128', function () {
        var compute = can.compute(NaN);
        compute.bind('change', function () {
            ok(false, 'change event should not be fired');
        });
        ok(isNaN(compute()));
        compute(NaN);
    });
    test('can.batch.afterPreviousEvents firing too late (#2198)', function () {
        var compute1 = can.compute('a'), compute2 = can.compute('b');
        var derived = can.compute(function () {
            return compute1().toUpperCase();
        });
        derived.bind('change', function () {
            var afterPrevious = false;
            compute2.bind('change', function () {
                ok(afterPrevious, 'after previous should have fired so we would respond to this event');
            });
            can.batch.start();
            can.batch.stop();
            can.batch.afterPreviousEvents(function () {
                afterPrevious = true;
            });
            compute2('c');
        });
        can.batch.start();
        compute1('x');
        can.batch.stop();
    });
});
/*model/model_test*/
define('can/model/model_test', function (require, exports, module) {
    var can = require('can/util/util');
    require('can/model/model');
    require('can/util/fixture/fixture');
    require('can/test/test');
    require('steal-qunit');
    QUnit.module('can/model', {
        setup: function () {
        }
    });
    var isDojo = typeof dojo !== 'undefined';
    test('shadowed id', function () {
        var MyModel = can.Model.extend({ id: 'foo' }, {
            foo: function () {
                return this.attr('foo');
            }
        });
        var newModel = new MyModel({});
        ok(newModel.isNew(), 'new model is isNew');
        var oldModel = new MyModel({ foo: 'bar' });
        ok(!oldModel.isNew(), 'old model is not new');
        equal(oldModel.foo(), 'bar', 'method can coexist with attribute');
    });
    test('findAll deferred', function () {
        can.Model('Person', {
            findAll: function (params, success, error) {
                var self = this;
                return can.ajax({
                    url: '/people',
                    data: params,
                    fixture: can.test.fixture('model/test/people.json'),
                    dataType: 'json'
                }).pipe(function (data) {
                    return self.models(data);
                });
            }
        }, {});
        stop();
        var people = Person.findAll({});
        people.then(function (people) {
            equal(people.length, 1, 'we got a person back');
            equal(people[0].name, 'Justin', 'Got a name back');
            equal(people[0].constructor.shortName, 'Person', 'got a class back');
            start();
        });
    });
    test('findAll rejects non-array (#384)', function () {
        var Person = can.Model.extend({
            findAll: function (params, success, error) {
                var dfd = can.Deferred();
                setTimeout(function () {
                    dfd.resolve({ stuff: {} });
                }, 100);
                return dfd;
            }
        }, {});
        stop();
        Person.findAll({}).then(function () {
            ok(false, 'This should not succeed');
        }, function (err) {
            ok(err instanceof Error, 'Got an error');
            equal(err.message, 'Could not get any raw data while converting using .models');
            start();
        });
    });
    asyncTest('findAll deferred reject', function () {
        function rejectDeferred(df) {
            setTimeout(function () {
                df.reject();
            }, 100);
        }
        function resolveDeferred(df) {
            setTimeout(function () {
                df.resolve();
            }, 100);
        }
        can.Model('Person', {
            findAll: function (params, success, error) {
                var df = can.Deferred();
                if (params.resolve) {
                    resolveDeferred(df);
                } else {
                    rejectDeferred(df);
                }
                return df;
            }
        }, {});
        var people_reject = Person.findAll({ resolve: false });
        var people_resolve = Person.findAll({ resolve: true });
        setTimeout(function () {
            people_reject.done(function () {
                ok(false, 'This deferred should be rejected');
            });
            people_reject.fail(function () {
                ok(true, 'The deferred is rejected');
            });
            people_resolve.done(function () {
                ok(true, 'This deferred is resolved');
            });
            people_resolve.fail(function () {
                ok(false, 'The deferred should be resolved');
            });
            start();
        }, 200);
    });
    if (window.jQuery) {
        asyncTest('findAll abort', function () {
            expect(4);
            var df;
            can.Model('Person', {
                findAll: function (params, success, error) {
                    df = can.Deferred();
                    df.then(function () {
                        ok(!params.abort, 'not aborted');
                    }, function () {
                        ok(params.abort, 'aborted');
                    });
                    return df.promise({
                        abort: function () {
                            df.reject();
                        }
                    });
                }
            }, {});
            Person.findAll({ abort: false }).done(function () {
                ok(true, 'resolved');
            });
            var resolveDf = df;
            var abortPromise = Person.findAll({ abort: true }).fail(function () {
                ok(true, 'failed');
            });
            setTimeout(function () {
                resolveDf.resolve();
                abortPromise.abort();
                start();
            }, 200);
        });
    }
    test('findOne deferred', function () {
        if (window.jQuery) {
            can.Model('Person', {
                findOne: function (params, success, error) {
                    var self = this;
                    return can.ajax({
                        url: '/people/5',
                        data: params,
                        fixture: can.test.fixture('model/test/person.json'),
                        dataType: 'json'
                    }).pipe(function (data) {
                        return self.model(data);
                    });
                }
            }, {});
        } else {
            can.Model('Person', { findOne: can.test.fixture('model/test/person.json') }, {});
        }
        stop();
        var person = Person.findOne({});
        person.then(function (person) {
            equal(person.name, 'Justin', 'Got a name back');
            equal(person.constructor.shortName, 'Person', 'got a class back');
            start();
        });
    });
    test('save deferred', function () {
        can.Model('Person', {
            create: function (attrs, success, error) {
                return can.ajax({
                    url: '/people',
                    data: attrs,
                    type: 'post',
                    dataType: 'json',
                    fixture: function () {
                        return { id: 5 };
                    },
                    success: success
                });
            }
        }, {});
        var person = new Person({ name: 'Justin' }), personD = person.save();
        stop();
        personD.then(function (person) {
            start();
            equal(person.id, 5, 'we got an id');
        });
    });
    test('update deferred', function () {
        can.Model('Person', {
            update: function (id, attrs, success, error) {
                return can.ajax({
                    url: '/people/' + id,
                    data: attrs,
                    type: 'post',
                    dataType: 'json',
                    fixture: function () {
                        return { thing: 'er' };
                    },
                    success: success
                });
            }
        }, {});
        var person = new Person({
                name: 'Justin',
                id: 5
            }), personD = person.save();
        stop();
        personD.then(function (person) {
            start();
            equal(person.thing, 'er', 'we got updated');
        });
    });
    test('destroy deferred', function () {
        can.Model('Person', {
            destroy: function (id, success, error) {
                return can.ajax({
                    url: '/people/' + id,
                    type: 'post',
                    dataType: 'json',
                    fixture: function () {
                        return { thing: 'er' };
                    },
                    success: success
                });
            }
        }, {});
        var person = new Person({
                name: 'Justin',
                id: 5
            }), personD = person.destroy();
        stop();
        personD.then(function (person) {
            start();
            equal(person.thing, 'er', 'we got destroyed');
        });
    });
    test('models', function () {
        can.Model('Person', {
            prettyName: function () {
                return 'Mr. ' + this.name;
            }
        });
        var people = Person.models([{
                id: 1,
                name: 'Justin'
            }]);
        equal(people[0].prettyName(), 'Mr. Justin', 'wraps wrapping works');
    });
    test('.models with custom id', function () {
        can.Model('CustomId', {
            findAll: can.test.path('model/test/customids.json'),
            id: '_id'
        }, {
            getName: function () {
                return this.name;
            }
        });
        var results = CustomId.models([
            {
                '_id': 1,
                'name': 'Justin'
            },
            {
                '_id': 2,
                'name': 'Brian'
            }
        ]);
        equal(results.length, 2, 'Got two items back');
        equal(results[0].name, 'Justin', 'First name right');
        equal(results[1].name, 'Brian', 'Second name right');
    });
    test('binding', 2, function () {
        can.Model('Person');
        var inst = new Person({ foo: 'bar' });
        inst.bind('foo', function (ev, val) {
            ok(true, 'updated');
            equal(val, 'baz', 'values match');
        });
        inst.attr('foo', 'baz');
    });
    test('auto methods', function () {
        can.fixture.on = false;
        var School = can.Model.extend('Jquery.Model.Models.School', {
            findAll: can.test.path('model/test/{type}.json'),
            findOne: can.test.path('model/test/{id}.json'),
            create: 'GET ' + can.test.path('model/test/create.json'),
            update: 'GET ' + can.test.path('model/test/update{id}.json')
        }, {});
        stop();
        School.findAll({ type: 'schools' }, function (schools) {
            ok(schools, 'findAll Got some data back');
            equal(schools[0].constructor.shortName, 'School', 'there are schools');
            School.findOne({ id: '4' }, function (school) {
                ok(school, 'findOne Got some data back');
                equal(school.constructor.shortName, 'School', 'a single school');
                new School({ name: 'Highland' }).save(function (school) {
                    equal(school.name, 'Highland', 'create gets the right name');
                    school.attr({ name: 'LHS' }).save(function () {
                        start();
                        equal(school.name, 'LHS', 'create gets the right name');
                        can.fixture.on = true;
                    });
                });
            });
        });
    });
    test('isNew', function () {
        var p = new Person();
        ok(p.isNew(), 'nothing provided is new');
        var p2 = new Person({ id: null });
        ok(p2.isNew(), 'null id is new');
        var p3 = new Person({ id: 0 });
        ok(!p3.isNew(), '0 is not new');
    });
    test('findAll string', function () {
        can.fixture.on = false;
        can.Model('Test.Thing', { findAll: can.test.path('model/test/findAll.json') + '' }, {});
        stop();
        Test.Thing.findAll({}, function (things) {
            equal(things.length, 1, 'got an array');
            equal(things[0].id, 1, 'an array of things');
            start();
            can.fixture.on = true;
        });
    });
    test('Model events', function () {
        expect(12);
        var order = 0;
        can.Model('Test.Event', {
            create: function (attrs) {
                var def = isDojo ? new dojo.Deferred() : new can.Deferred();
                def.resolve({ id: 1 });
                return def;
            },
            update: function (id, attrs, success) {
                var def = isDojo ? new dojo.Deferred() : new can.Deferred();
                def.resolve(attrs);
                return def;
            },
            destroy: function (id, success) {
                var def = isDojo ? new dojo.Deferred() : new can.Deferred();
                def.resolve({});
                return def;
            }
        }, {});
        stop();
        Test.Event.bind('created', function (ev, passedItem) {
            ok(this === Test.Event, 'got model');
            ok(passedItem === item, 'got instance');
            equal(++order, 1, 'order');
            passedItem.save();
        }).bind('updated', function (ev, passedItem) {
            equal(++order, 2, 'order');
            ok(this === Test.Event, 'got model');
            ok(passedItem === item, 'got instance');
            passedItem.destroy();
        }).bind('destroyed', function (ev, passedItem) {
            equal(++order, 3, 'order');
            ok(this === Test.Event, 'got model');
            ok(passedItem === item, 'got instance');
            start();
        });
        var item = new Test.Event();
        item.bind('created', function () {
            ok(true, 'created');
        }).bind('updated', function () {
            ok(true, 'updated');
        }).bind('destroyed', function () {
            ok(true, 'destroyed');
        });
        item.save();
    });
    test('removeAttr test', function () {
        can.Model('Person');
        var person = new Person({ foo: 'bar' });
        equal(person.foo, 'bar', 'property set');
        person.removeAttr('foo');
        equal(person.foo, undefined, 'property removed');
        var attrs = person.attr();
        equal(attrs.foo, undefined, 'attrs removed');
    });
    test('save error args', function () {
        var Foo = can.Model.extend('Testin.Models.Foo', { create: '/testinmodelsfoos.json' }, {});
        var st = '{type: "unauthorized"}';
        can.fixture('/testinmodelsfoos.json', function (request, response) {
            response(401, st);
        });
        stop();
        new Foo({}).save(function () {
            ok(false, 'success should not be called');
            start();
        }, function (jQXHR) {
            ok(true, 'error called');
            ok(jQXHR.getResponseHeader, 'jQXHR object');
            start();
        });
    });
    test('object definitions', function () {
        can.Model('ObjectDef', {
            findAll: {
                url: '/test/place',
                dataType: 'json'
            },
            findOne: {
                url: '/objectdef/{id}',
                timeout: 1000
            },
            create: {},
            update: {},
            destroy: {}
        }, {});
        can.fixture('GET /objectdef/{id}', function (original) {
            equal(original.timeout, 1000, 'timeout set');
            return { yes: true };
        });
        can.fixture('GET /test/place', function (original) {
            return [original.data];
        });
        stop();
        ObjectDef.findOne({ id: 5 }, function () {
            start();
        });
        stop();
        ObjectDef.findAll({
            start: 0,
            count: 10,
            myflag: 1
        }, function (data) {
            start();
            equal(data[0].myflag, 1, 'my flag set');
        });
        stop();
        ObjectDef.findAll({
            start: 0,
            count: 10
        }, function (data) {
            start();
            equal(data[0].myflag, undefined, 'my flag is undefined');
        });
    });
    test('aborting create update and destroy', function () {
        stop();
        var delay = can.fixture.delay;
        can.fixture.delay = 1000;
        can.fixture('POST /abort', function () {
            ok(false, 'we should not be calling the fixture');
            return {};
        });
        can.Model('Abortion', {
            create: 'POST /abort',
            update: 'POST /abort',
            destroy: 'POST /abort'
        }, {});
        var deferred = new Abortion({ name: 'foo' }).save(function () {
            ok(false, 'success create');
            start();
        }, function () {
            ok(true, 'create error called');
            deferred = new Abortion({
                name: 'foo',
                id: 5
            }).save(function () {
                ok(false, 'save called');
                start();
            }, function () {
                ok(true, 'error called in update');
                deferred = new Abortion({
                    name: 'foo',
                    id: 5
                }).destroy(function () {
                }, function () {
                    ok(true, 'destroy error called');
                    can.fixture.delay = delay;
                    start();
                });
                setTimeout(function () {
                    deferred.abort();
                }, 10);
            });
            setTimeout(function () {
                deferred.abort();
            }, 10);
        });
        setTimeout(function () {
            deferred.abort();
        }, 10);
    });
    test('store binding', function () {
        can.Model('Storage');
        var s = new Storage({
            id: 1,
            thing: { foo: 'bar' }
        });
        ok(!Storage.store[1], 'not stored');
        var func = function () {
        };
        s.bind('foo', func);
        ok(Storage.store[1], 'stored');
        s.unbind('foo', func);
        ok(!Storage.store[1], 'not stored');
        var s2 = new Storage({});
        s2.bind('foo', func);
        s2.attr('id', 5);
        ok(Storage.store[5], 'stored');
        s2.unbind('foo', func);
        ok(!Storage.store[5], 'not stored');
    });
    test('store ajax binding', function () {
        var Guy = can.Model.extend({
            findAll: '/guys',
            findOne: '/guy/{id}'
        }, {});
        can.fixture('GET /guys', function () {
            return [{ id: 1 }];
        });
        can.fixture('GET /guy/{id}', function () {
            return { id: 1 };
        });
        stop();
        can.when(Guy.findOne({ id: 1 }), Guy.findAll()).then(function (guyRes, guysRes2) {
            equal(guyRes.id, 1, 'got a guy id 1 back');
            equal(guysRes2[0].id, 1, 'got guys w/ id 1 back');
            ok(guyRes === guysRes2[0], 'guys are the same');
            setTimeout(function () {
                var id;
                start();
                for (id in Guy.store) {
                    ok(false, 'there should be nothing in the store');
                }
            }, 1);
        });
    });
    test('store instance updates', function () {
        var Guy, updateCount;
        Guy = can.Model.extend({ findAll: 'GET /guys' }, {});
        updateCount = 0;
        can.fixture('GET /guys', function () {
            var guys = [{
                    id: 1,
                    updateCount: updateCount,
                    nested: { count: updateCount }
                }];
            updateCount++;
            return guys;
        });
        stop();
        Guy.findAll({}, function (guys) {
            start();
            guys[0].bind('updated', function () {
            });
            ok(Guy.store[1], 'instance stored');
            equal(Guy.store[1].updateCount, 0, 'updateCount is 0');
            equal(Guy.store[1].nested.count, 0, 'nested.count is 0');
        });
        Guy.findAll({}, function (guys) {
            equal(Guy.store[1].updateCount, 1, 'updateCount is 1');
            equal(Guy.store[1].nested.count, 1, 'nested.count is 1');
        });
    });
    test('templated destroy', function () {
        var MyModel = can.Model.extend({ destroy: '/destroyplace/{id}' }, {});
        can.fixture('/destroyplace/{id}', function (original) {
            ok(true, 'fixture called');
            equal(original.url, '/destroyplace/5', 'urls match');
            return {};
        });
        stop();
        new MyModel({ id: 5 }).destroy(function () {
            start();
        });
        can.fixture('/product/{id}', function (original) {
            equal(original.data.id, 9001, 'Changed ID is correctly set.');
            start();
            return {};
        });
        Base = can.Model.extend({ id: '_id' }, {});
        Product = Base({ destroy: 'DELETE /product/{id}' }, {});
        new Product({ _id: 9001 }).destroy();
        stop();
    });
    test('extended templated destroy', function () {
        var MyModel = can.Model({ destroy: '/destroyplace/{attr1}/{attr2}/{id}' }, {});
        can.fixture('/destroyplace/{attr1}/{attr2}/{id}', function (original) {
            ok(true, 'fixture called');
            equal(original.url, '/destroyplace/foo/bar/5', 'urls match');
            return {};
        });
        stop();
        new MyModel({
            id: 5,
            attr1: 'foo',
            attr2: 'bar'
        }).destroy(function () {
            start();
        });
        can.fixture('/product/{attr3}/{id}', function (original) {
            equal(original.data.id, 9001, 'Changed ID is correctly set.');
            start();
            return {};
        });
        Base = can.Model({ id: '_id' }, {});
        Product = Base({ destroy: 'DELETE /product/{attr3}/{id}' }, {});
        new Product({
            _id: 9001,
            attr3: 'great'
        }).destroy();
        stop();
    });
    test('overwrite makeFindAll', function () {
        var store = {};
        var LocalModel = can.Model.extend({
            makeFindOne: function (findOne) {
                return function (params, success, error) {
                    var def = new can.Deferred(), data = store[params.id];
                    def.then(success, error);
                    var findOneDeferred = findOne(params);
                    if (data) {
                        var instance = this.model(data);
                        findOneDeferred.then(function (data) {
                            instance.updated(data);
                        }, function () {
                            can.trigger(instance, 'error', data);
                        });
                        def.resolve(instance);
                    } else {
                        findOneDeferred.then(can.proxy(function (data) {
                            var instance = this.model(data);
                            store[instance[this.id]] = data;
                            def.resolve(instance);
                        }, this), function (data) {
                            def.reject(data);
                        });
                    }
                    return def;
                };
            }
        }, {
            updated: function (attrs) {
                can.Model.prototype.updated.apply(this, arguments);
                store[this[this.constructor.id]] = this.serialize();
            }
        });
        can.fixture('/food/{id}', function (settings) {
            return count === 0 ? {
                id: settings.data.id,
                name: 'hot dog'
            } : {
                id: settings.data.id,
                name: 'ice water'
            };
        });
        var Food = LocalModel({ findOne: '/food/{id}' }, {});
        stop();
        var count = 0;
        Food.findOne({ id: 1 }, function (food) {
            count = 1;
            ok(true, 'empty findOne called back');
            food.bind('name', function () {
                ok(true, 'name changed');
                equal(count, 2, 'after last find one');
                equal(this.name, 'ice water');
                start();
            });
            Food.findOne({ id: 1 }, function (food2) {
                count = 2;
                ok(food2 === food, 'same instances');
                equal(food2.name, 'hot dog');
            });
        });
    });
    test('inheriting unique model names', function () {
        var Foo = can.Model.extend({});
        var Bar = can.Model.extend({});
        ok(Foo.fullName !== Bar.fullName, 'fullNames not the same');
    });
    test('model list attr', function () {
        can.Model('Person', {}, {});
        var list1 = new Person.List(), list2 = new Person.List([
                new Person({ id: 1 }),
                new Person({ id: 2 })
            ]);
        equal(list1.length, 0, 'Initial empty list has length of 0');
        list1.attr(list2);
        equal(list1.length, 2, 'Merging using attr yields length of 2');
    });
    test('destroying a model impact the right list', function () {
        can.Model('Person', {
            destroy: function (id, success) {
                var def = isDojo ? new dojo.Deferred() : new can.Deferred();
                def.resolve({});
                return def;
            }
        }, {});
        can.Model('Organisation', {
            destroy: function (id, success) {
                var def = isDojo ? new dojo.Deferred() : new can.Deferred();
                def.resolve({});
                return def;
            }
        }, {});
        var people = new Person.List([
                new Person({ id: 1 }),
                new Person({ id: 2 })
            ]), orgs = new Organisation.List([
                new Organisation({ id: 1 }),
                new Organisation({ id: 2 })
            ]);
        people.bind('length', function () {
        });
        orgs.bind('length', function () {
        });
        people[0].attr('organisation', orgs[0]);
        people[1].attr('organisation', orgs[1]);
        equal(people.length, 2, 'Initial Person.List has length of 2');
        equal(orgs.length, 2, 'Initial Organisation.List has length of 2');
        orgs[0].destroy();
        equal(people.length, 2, 'After destroying orgs[0] Person.List has length of 2');
        equal(orgs.length, 1, 'After destroying orgs[0] Organisation.List has length of 1');
    });
    test('uses attr with isNew', function () {
        var old = can.__observe;
        can.__observe = function (object, attribute) {
            if (attribute === 'id') {
                ok(true, 'used attr');
            }
        };
        var m = new can.Model({ id: 4 });
        m.isNew();
        can.__observe = old;
    });
    test('extends defaults by calling base method', function () {
        var M1 = can.Model.extend({ defaults: { foo: 'bar' } }, {});
        var M2 = M1({});
        equal(M2.defaults.foo, 'bar');
    });
    test('.models updates existing list if passed', 4, function () {
        var Model = can.Model.extend({});
        var list = Model.models([
            {
                id: 1,
                name: 'first'
            },
            {
                id: 2,
                name: 'second'
            }
        ]);
        list.bind('add', function (ev, newData) {
            equal(newData.length, 3, 'Got all new items at once');
        });
        var newList = Model.models([
            {
                id: 3,
                name: 'third'
            },
            {
                id: 4,
                name: 'fourth'
            },
            {
                id: 5,
                name: 'fifth'
            }
        ], list);
        equal(list, newList, 'Lists are the same');
        equal(newList.attr('length'), 3, 'List has new items');
        equal(list[0].name, 'third', 'New item is the first one');
    });
    test('calling destroy with unsaved model triggers destroyed event (#181)', function () {
        var MyModel = can.Model.extend({}, {}), newModel = new MyModel(), list = new MyModel.List(), deferred;
        list.bind('length', function () {
        });
        list.push(newModel);
        equal(list.attr('length'), 1, 'List length as expected');
        deferred = newModel.destroy();
        ok(deferred, '.destroy returned a Deferred');
        equal(list.attr('length'), 0, 'Unsaved model removed from list');
        deferred.done(function (data) {
            ok(data === newModel, 'Resolved with destroyed model as described in docs');
        });
    });
    test('model removeAttr (#245)', function () {
        var MyModel = can.Model.extend({}), model;
        can.Model._reqs++;
        model = MyModel.model({
            id: 0,
            index: 2,
            name: 'test'
        });
        model = MyModel.model({
            id: 0,
            name: 'text updated'
        });
        equal(model.attr('name'), 'text updated', 'attribute updated');
        equal(model.attr('index'), 2, 'Index attribute still remains');
        MyModel = can.Model.extend({ removeAttr: true }, {});
        can.Model._reqs++;
        model = MyModel.model({
            id: 0,
            index: 2,
            name: 'test'
        });
        model = MyModel.model({
            id: 0,
            name: 'text updated'
        });
        equal(model.attr('name'), 'text updated', 'attribute updated');
        deepEqual(model.attr(), {
            id: 0,
            name: 'text updated'
        }, 'Index attribute got removed');
    });
    test('.model on create and update (#301)', function () {
        var MyModel = can.Model.extend({
                create: 'POST /todo',
                update: 'PUT /todo',
                model: function (data) {
                    return can.Model.model.call(this, data.item);
                }
            }, {}), id = 0, updateTime;
        can.fixture('POST /todo', function (original, respondWith, settings) {
            id++;
            return { item: can.extend(original.data, { id: id }) };
        });
        can.fixture('PUT /todo', function (original, respondWith, settings) {
            updateTime = new Date().getTime();
            return { item: { updatedAt: updateTime } };
        });
        stop();
        MyModel.bind('created', function (ev, created) {
            start();
            deepEqual(created.attr(), {
                id: 1,
                name: 'Dishes'
            }, '.model works for create');
        }).bind('updated', function (ev, updated) {
            start();
            deepEqual(updated.attr(), {
                id: 1,
                name: 'Laundry',
                updatedAt: updateTime
            }, '.model works for update');
        });
        var instance = new MyModel({ name: 'Dishes' }), saveD = instance.save();
        stop();
        saveD.then(function () {
            instance.attr('name', 'Laundry').save();
        });
    });
    test('List params uses findAll', function () {
        stop();
        can.fixture('/things', function (request) {
            equal(request.data.param, 'value', 'params passed');
            return [{
                    id: 1,
                    name: 'Thing One'
                }];
        });
        var Model = can.Model.extend({ findAll: '/things' }, {});
        var items = new Model.List({ param: 'value' });
        items.bind('add', function (ev, items, index) {
            equal(items[0].name, 'Thing One', 'items added');
            start();
        });
    });
    test('destroy not calling callback for new instances (#403)', function () {
        var Recipe = can.Model.extend({}, {});
        expect(1);
        stop();
        new Recipe({ name: 'mow grass' }).destroy(function (recipe) {
            ok(true, 'Destroy called');
            start();
        });
    });
    test('.model should always serialize Observes (#444)', function () {
        var ConceptualDuck = can.Model.extend({ defaults: { sayeth: 'Abstractly \'quack\'' } }, {});
        var ObserveableDuck = can.Map({}, {});
        equal('quack', ConceptualDuck.model(new ObserveableDuck({ sayeth: 'quack' })).sayeth);
    });
    test('string configurable model and models functions (#128)', function () {
        var StrangeProp = can.Model.extend({
            model: 'foo',
            models: 'bar'
        }, {});
        var strangers = StrangeProp.models({
            bar: [
                {
                    foo: {
                        id: 1,
                        name: 'one'
                    }
                },
                {
                    foo: {
                        id: 2,
                        name: 'two'
                    }
                }
            ]
        });
        deepEqual(strangers.attr(), [
            {
                id: 1,
                name: 'one'
            },
            {
                id: 2,
                name: 'two'
            }
        ]);
    });
    test('create deferred does not resolve to the same instance', function () {
        var Todo = can.Model.extend({
            create: function () {
                var def = new can.Deferred();
                def.resolve({ id: 5 });
                return def;
            }
        }, {});
        var handler = function () {
        };
        var t = new Todo({ name: 'Justin' });
        t.bind('name', handler);
        var def = t.save();
        stop();
        def.then(function (todo) {
            ok(todo === t, 'same instance');
            start();
            ok(Todo.store[5] === t, 'instance put in store');
            t.unbind('name', handler);
        });
    });
    test('Model#save should not replace attributes with their default values (#560)', function () {
        can.fixture('POST /person.json', function (request, response) {
            return { createdAt: 'now' };
        });
        var Person = can.Model.extend({ update: 'POST /person.json' }, { name: 'Example name' });
        var person = new Person({
                id: 5,
                name: 'Justin'
            }), personD = person.save();
        stop();
        personD.then(function (person) {
            start();
            equal(person.name, 'Justin', 'Model name attribute value is preserved after save');
        });
    });
    test('.parseModel as function on create and update (#560)', function () {
        var MyModel = can.Model.extend({
                create: 'POST /todo',
                update: 'PUT /todo',
                parseModel: function (data) {
                    return data.item;
                }
            }, { aDefault: 'foo' }), id = 0, updateTime;
        can.fixture('POST /todo', function (original, respondWith, settings) {
            id++;
            return { item: can.extend(original.data, { id: id }) };
        });
        can.fixture('PUT /todo', function (original, respondWith, settings) {
            updateTime = new Date().getTime();
            return { item: { updatedAt: updateTime } };
        });
        stop();
        MyModel.bind('created', function (ev, created) {
            start();
            deepEqual(created.attr(), {
                id: 1,
                name: 'Dishes',
                aDefault: 'bar'
            }, '.model works for create');
        }).bind('updated', function (ev, updated) {
            start();
            deepEqual(updated.attr(), {
                id: 1,
                name: 'Laundry',
                updatedAt: updateTime
            }, '.model works for update');
        });
        var instance = new MyModel({
                name: 'Dishes',
                aDefault: 'bar'
            }), saveD = instance.save();
        stop();
        saveD.then(function () {
            instance.attr('name', 'Laundry');
            instance.removeAttr('aDefault');
            instance.save();
        });
    });
    test('.parseModel as string on create and update (#560)', function () {
        var MyModel = can.Model.extend({
                create: 'POST /todo',
                update: 'PUT /todo',
                parseModel: 'item'
            }, { aDefault: 'foo' }), id = 0, updateTime;
        can.fixture('POST /todo', function (original, respondWith, settings) {
            id++;
            return { item: can.extend(original.data, { id: id }) };
        });
        can.fixture('PUT /todo', function (original, respondWith, settings) {
            updateTime = new Date().getTime();
            return { item: { updatedAt: updateTime } };
        });
        stop();
        MyModel.bind('created', function (ev, created) {
            start();
            deepEqual(created.attr(), {
                id: 1,
                name: 'Dishes',
                aDefault: 'bar'
            }, '.model works for create');
        }).bind('updated', function (ev, updated) {
            start();
            deepEqual(updated.attr(), {
                id: 1,
                name: 'Laundry',
                updatedAt: updateTime
            }, '.model works for update');
        });
        var instance = new MyModel({
                name: 'Dishes',
                aDefault: 'bar'
            }), saveD = instance.save();
        stop();
        saveD.then(function () {
            instance.attr('name', 'Laundry');
            instance.removeAttr('aDefault');
            instance.save();
        });
    });
    test('parseModels and findAll', function () {
        var array = [{
                id: 1,
                name: 'first'
            }];
        can.fixture('/mymodels', function () {
            return array;
        });
        var MyModel = can.Model.extend({
            findAll: '/mymodels',
            parseModels: function (raw, xhr) {
                if (window.jQuery) {
                    ok(xhr, 'xhr object provided');
                }
                equal(array, raw, 'got passed raw data');
                return {
                    data: raw,
                    count: 1000
                };
            }
        }, {});
        stop();
        MyModel.findAll({}, function (models) {
            equal(models.count, 1000);
            start();
        });
    });
    test('parseModels and parseModel and findAll', function () {
        can.fixture('/mymodels', function () {
            return {
                myModels: [{
                        myModel: {
                            id: 1,
                            name: 'first'
                        }
                    }]
            };
        });
        var MyModel = can.Model.extend({
            findAll: '/mymodels',
            parseModels: 'myModels',
            parseModel: 'myModel'
        }, {});
        stop();
        MyModel.findAll({}, function (models) {
            deepEqual(models.attr(), [{
                    id: 1,
                    name: 'first'
                }], 'correct models returned');
            start();
        });
    });
    test('findAll rejects when parseModels returns non-array data #1662', function () {
        can.fixture('/mymodels', function () {
            return {
                status: 'success',
                message: ''
            };
        });
        var MyModel = can.Model.extend({
            findAll: '/mymodels',
            parseModels: function (raw) {
                raw.data = undefined;
                return raw;
            }
        }, {});
        stop();
        MyModel.findAll({}).then(function () {
            ok(false, 'This should not succeed');
            start();
        }, function (err) {
            ok(err instanceof Error, 'Got an error');
            equal(err.message, 'Could not get any raw data while converting using .models');
            start();
        });
    });
    test('Nested lists', function () {
        var Teacher = can.Model.extend({});
        var teacher = new Teacher();
        teacher.attr('locations', [
            {
                id: 1,
                name: 'Chicago'
            },
            {
                id: 2,
                name: 'LA'
            }
        ]);
        ok(!(teacher.attr('locations') instanceof Teacher.List), 'nested list is not an instance of Teacher.List');
        ok(!(teacher.attr('locations')[0] instanceof Teacher), 'nested map is not an instance of Teacher');
    });
    test('#501 - resource definition - create', function () {
        can.fixture('/foods', function () {
            return [];
        });
        var FoodModel = can.Model.extend({ resource: '/foods' }, {});
        stop();
        var steak = new FoodModel({ name: 'steak' });
        steak.save(function (food) {
            equal(food.name, 'steak', 'create created the correct model');
            start();
        });
    });
    test('#501 - resource definition - findAll', function () {
        can.fixture('/drinks', function () {
            return [{
                    id: 1,
                    name: 'coke'
                }];
        });
        var DrinkModel = can.Model.extend({ resource: '/drinks' }, {});
        stop();
        DrinkModel.findAll({}, function (drinks) {
            deepEqual(drinks.attr(), [{
                    id: 1,
                    name: 'coke'
                }], 'findAll returned the correct models');
            start();
        });
    });
    test('#501 - resource definition - findOne', function () {
        can.fixture('GET /clothes/{id}', function () {
            return [{
                    id: 1,
                    name: 'pants'
                }];
        });
        var ClothingModel = can.Model.extend({ resource: '/clothes' }, {});
        stop();
        ClothingModel.findOne({ id: 1 }, function (item) {
            equal(item[0].name, 'pants', 'findOne returned the correct model');
            start();
        });
    });
    test('#501 - resource definition - remove trailing slash(es)', function () {
        can.fixture('POST /foods', function () {
            return [];
        });
        var FoodModel = can.Model.extend({ resource: '/foods//////' }, {});
        stop();
        var steak = new FoodModel({ name: 'steak' });
        steak.save(function (food) {
            equal(food.name, 'steak', 'removed trailing \'/\' and created the correct model');
            start();
        });
    });
    test('model list destroy after calling replace', function () {
        expect(2);
        var map = new can.Model({ name: 'map1' });
        var map2 = new can.Model({ name: 'map2' });
        var list = new can.Model.List([
            map,
            map2
        ]);
        list.bind('destroyed', function (ev) {
            ok(true, 'trigger destroyed');
        });
        can.trigger(map, 'destroyed');
        list.replace([map2]);
        can.trigger(map2, 'destroyed');
    });
    test('a model defined with a fullName has findAll working (#1034)', function () {
        var List = can.List.extend();
        can.Model.extend('My.Model', { List: List }, {});
        equal(List.Map, My.Model, 'list\'s Map points to My.Model');
    });
    test('providing parseModels works', function () {
        var MyModel = can.Model.extend({ parseModel: 'modelData' }, {});
        var data = MyModel.parseModel({ modelData: { id: 1 } });
        equal(data.id, 1, 'correctly used parseModel');
    });
    test('#1089 - resource definition - inheritance', function () {
        can.fixture('GET /things/{id}', function () {
            return {
                id: 0,
                name: 'foo'
            };
        });
        var Base = can.Model.extend();
        var Thing = Base.extend({ resource: '/things' }, {});
        stop();
        Thing.findOne({ id: 0 }, function (thing) {
            equal(thing.name, 'foo', 'found model in inherited model');
            start();
        }, function (e, msg) {
            ok(false, msg);
            start();
        });
    });
    test('#1089 - resource definition - CRUD overrides', function () {
        can.fixture('GET /foos/{id}', function () {
            return {
                id: 0,
                name: 'foo'
            };
        });
        can.fixture('POST /foos', function () {
            return { id: 1 };
        });
        can.fixture('PUT /foos/{id}', function () {
            return {
                id: 1,
                updated: true
            };
        });
        can.fixture('GET /bars', function () {
            return [{}];
        });
        var Thing = can.Model.extend({
            resource: '/foos',
            findAll: 'GET /bars',
            update: {
                url: '/foos/{id}',
                type: 'PUT'
            },
            create: function () {
                return can.ajax({
                    url: '/foos',
                    type: 'POST'
                });
            }
        }, {});
        var alldfd = Thing.findAll(), onedfd = Thing.findOne({ id: 0 }), postdfd = new Thing().save();
        stop();
        can.when(alldfd, onedfd, postdfd).then(function (things, thing, newthing) {
            equal(things.length, 1, 'findAll override called');
            equal(thing.name, 'foo', 'resource findOne called');
            equal(newthing.id, 1, 'post override called with function');
            newthing.save(function (res) {
                ok(res.updated, 'put override called with object');
                start();
            });
        }).fail(function () {
            ok(false, 'override request failed');
            start();
        });
    });
    test('findAll not called if List constructor argument is deferred (#1074)', function () {
        var count = 0;
        var Foo = can.Model.extend({
            findAll: function () {
                count++;
                return can.Deferred();
            }
        }, {});
        new Foo.List(Foo.findAll());
        equal(count, 1, 'findAll called only once.');
    });
    test('static methods do not get overwritten with resource property set (#1309)', function () {
        var Base = can.Model.extend({
            resource: '/path',
            findOne: function () {
                var dfd = can.Deferred();
                dfd.resolve({ text: 'Base findAll' });
                return dfd;
            }
        }, {});
        stop();
        Base.findOne({}).then(function (model) {
            ok(model instanceof Base);
            deepEqual(model.attr(), { text: 'Base findAll' });
            start();
        }, function () {
            ok(false, 'Failed handler should not be called.');
        });
    });
    test('parseModels does not get overwritten if already implemented in base class (#1246, #1272)', 5, function () {
        var Base = can.Model.extend({
            findOne: function () {
                var dfd = can.Deferred();
                dfd.resolve({ text: 'Base findOne' });
                return dfd;
            },
            parseModel: function (attributes) {
                deepEqual(attributes, { text: 'Base findOne' }, 'parseModel called');
                attributes.parsed = true;
                return attributes;
            }
        }, {});
        var Extended = Base.extend({}, {});
        stop();
        Extended.findOne({}).then(function (model) {
            ok(model instanceof Base);
            ok(model instanceof Extended);
            deepEqual(model.attr(), {
                text: 'Base findOne',
                parsed: true
            });
            start();
        }, function () {
            ok(false, 'Failed handler should not be called.');
        });
        var Third = Extended.extend({
            findOne: function () {
                var dfd = can.Deferred();
                dfd.resolve({ nested: { text: 'Third findOne' } });
                return dfd;
            },
            parseModel: 'nested'
        }, {});
        Third.findOne({}).then(function (model) {
            equal(model.attr('text'), 'Third findOne', 'correct findOne used');
        });
    });
    test('Models with no id (undefined or null) are not placed in store (#1358)', function () {
        var MyStandardModel = can.Model.extend({});
        var MyCustomModel = can.Model.extend({ id: 'ID' }, {});
        var myID = null;
        var instanceNull = new MyStandardModel({ id: myID });
        var instanceUndefined = new MyStandardModel({});
        var instanceCustom = new MyCustomModel({ ID: myID });
        instanceNull.bind('change', function () {
        });
        instanceUndefined.bind('change', function () {
        });
        instanceCustom.bind('change', function () {
        });
        ok(typeof MyStandardModel.store[instanceNull.id] === 'undefined', 'Model should not be added to store when id is null');
        ok(typeof MyStandardModel.store[instanceUndefined.id] === 'undefined', 'Model should not be added to store when id is undefined');
        ok(typeof MyCustomModel.store[instanceCustom[instanceCustom.constructor.id]] === 'undefined', 'Model should not be added to store when id is null');
    });
    test('Models should be removed from store when instance.removeAttr(\'id\') is called', function () {
        var Task = can.Model.extend({}, {});
        var t1 = new Task({
            id: 1,
            name: 'MyTask'
        });
        t1.bind('change', function () {
        });
        ok(Task.store[t1.id].name === 'MyTask', 'Model should be in store');
        t1.removeAttr('id');
        ok(typeof Task.store[t1.id] === 'undefined', 'Model should be removed from store when `id` is removed');
    });
});
/*view/view_test*/
define('can/view/view_test', function (require, exports, module) {
    var can = require('can/util/util');
    require('can/view/view');
    require('can/view/callbacks/callbacks');
    require('can/view/stache/stache');
    require('can/observe/observe');
    require('can/util/fixture/fixture');
    require('can/test/test');
    require('steal-qunit');
    var restoreInfo = [];
    var copy = function (source) {
        var copied = can.isArray(source) ? source.slice(0) : can.extend({}, source);
        restoreInfo.push({
            source: source,
            copy: copied
        });
    };
    var restore = function () {
        can.each(restoreInfo, function (data) {
            if (can.isArray(data.source)) {
                data.source.splice(0, data.source.length);
                data.source.push.apply(data.source, data.copy);
            } else {
                for (var prop in data.source) {
                    delete data.source[prop];
                }
                can.extend(data.source, data.copy);
            }
        });
    };
    var getStringResult = function (src) {
        var result;
        if (typeof src === 'string') {
            result = src;
        } else if (src.toString() === '[object DocumentFragment]') {
            var div = document.createElement('div');
            div.appendChild(src);
            result = div.innerHTML;
        }
        return can.trim(result);
    };
    QUnit.module('can/view', {
        setup: function () {
            copy(can.view.callbacks._attributes);
            copy(can.view.callbacks._regExpAttributes);
            copy(can.view.callbacks._tags);
        },
        teardown: function () {
            restore();
        }
    });
    test('basic loading', function () {
        var data = { message: 'hello' }, expected = '<h1>hello</h1>', templates = { 'stache': '<h1>{{message}}</h1>' }, templateUrl = function (ext) {
                return can.test.path('view/test/basic_loading.' + ext);
            };
        can.each(['stache'], function (ext) {
            var result = can.view(templateUrl(ext), data);
            equal(result.childNodes[0].nodeName.toLowerCase(), 'h1', ext + ' can.view(url,data) ' + 'got an h1');
            equal(result.childNodes[0].innerHTML, 'hello', ext + ' can.view(url,data) ' + 'innerHTML');
            result = can.view(templateUrl(ext))(data);
            equal(result.childNodes[0].nodeName.toLowerCase(), 'h1', ext + ' can.view(url)(data) ' + 'got an h1');
            equal(result.childNodes[0].innerHTML, 'hello', ext + ' can.view(url)(data) ' + 'innerHTML');
            result = can.view(templateUrl(ext))(data);
            equal(result.childNodes[0].nodeName.toLowerCase(), 'h1', ext + ' can.view(url)(data) ' + 'got an h1');
            equal(result.childNodes[0].innerHTML, 'hello', ext + ' can.view(url)(data) ' + 'innerHTML');
            result = can[ext](templates[ext])(data);
            equal(result.childNodes[0].nodeName.toLowerCase(), 'h1', ext + ' can.' + ext + '(template)(data) ' + 'got an h1');
            equal(result.childNodes[0].innerHTML, 'hello', ext + ' can.' + ext + '(template)(data) ' + 'innerHTML');
            if (ext !== 'stache') {
                result = can.view(templateUrl(ext)).render(data);
                equal(result, expected, ext + ' can.view(url).renderer(data) ' + 'result');
                result = can[ext](templates[ext]).render(data);
                equal(result, expected, ext + ' can.' + ext + '(template).renderer(data) ' + 'result');
            }
        });
    });
    test('helpers work', function () {
        var expected = '<h3>helloworld</h3><div>foo</div>';
        can.each(['stache'], function (ext, i) {
            var actual = can.view.render(can.test.path('view/test/helpers.' + ext), { 'message': 'helloworld' }, {
                helper: function () {
                    return 'foo';
                }
            });
            equal(getStringResult(actual), expected, 'Text rendered');
        });
    });
    test('async templates, and caching work', function () {
        stop();
        var i = 0;
        can.view.render(can.test.path('view/test/temp.stache'), { 'message': 'helloworld' }, function (result) {
            var text = getStringResult(result);
            ok(/helloworld\s*/.test(text), 'we got a rendered template');
            i++;
            equal(i, 2, 'Ajax is not synchronous');
            start();
        });
        i++;
        equal(i, 1, 'Ajax is not synchronous');
    });
    test('caching works', function () {
        stop();
        var first;
        can.view.render(can.test.path('view/test/large.stache'), { 'message': 'helloworld' }, function (text) {
            first = new Date();
            ok(text, 'we got a rendered template');
            can.view.render(can.test.path('view/test/large.stache'), { 'message': 'helloworld' }, function (text) {
                start();
            });
        });
    });
    test('inline templates other than \'tmpl\'', function () {
        var script = document.createElement('script');
        script.setAttribute('type', 'test/stach');
        script.setAttribute('id', 'test_stache');
        script.text = '<span id="new_name">{{name}}</span>';
        document.getElementById('qunit-fixture').appendChild(script);
        var div = document.createElement('div');
        div.appendChild(can.view('test_stache', { name: 'Henry' }));
        equal(div.getElementsByTagName('span')[0].firstChild.nodeValue, 'Henry');
    });
    test('render inline templates with a #', function () {
        var script = document.createElement('script');
        script.setAttribute('type', 'test/stache');
        script.setAttribute('id', 'test_stache');
        script.text = '<span id="new_name">{{name}}</span>';
        document.getElementById('qunit-fixture').appendChild(script);
        var div = document.createElement('div');
        div.appendChild(can.view('#test_stache', { name: 'Henry' }));
        equal(div.getElementsByTagName('script').length, 0, 'Current document was not used as template');
        if (div.getElementsByTagName('span').length === 1) {
            equal(div.getElementsByTagName('span')[0].firstChild.nodeValue, 'Henry');
        }
    });
    test('object of deferreds', function () {
        var foo = new can.Deferred(), bar = new can.Deferred();
        stop();
        can.view.render(can.test.path('view/test/deferreds.stache'), {
            foo: typeof foo.promise === 'function' ? foo.promise() : foo,
            bar: bar
        }).then(function (result) {
            equal(getStringResult(result), 'FOO and BAR');
            start();
        });
        setTimeout(function () {
            foo.resolve('FOO');
        }, 100);
        bar.resolve('BAR');
    });
    test('deferred', function () {
        var foo = new can.Deferred();
        stop();
        can.view.render(can.test.path('view/test//deferred.stache'), foo).then(function (result) {
            equal(getStringResult(result), 'FOO');
            start();
        });
        setTimeout(function () {
            foo.resolve({ foo: 'FOO' });
        }, 100);
    });
    test('hyphen in type', function () {
        var script = document.createElement('script');
        script.setAttribute('type', 'text/x-stache');
        script.setAttribute('id', 'hyphenStache');
        script.text = '\nHyphen\n';
        document.getElementById('qunit-fixture').appendChild(script);
        var div = document.createElement('div');
        div.appendChild(can.view('hyphenStache', {}));
        ok(/Hyphen/.test(div.innerHTML), 'has hyphen');
    });
    test('create template with string', function () {
        can.view.stache('fool', 'everybody plays the {{who}} {{howOften}}');
        var div = document.createElement('div');
        div.appendChild(can.view('fool', {
            who: 'fool',
            howOften: 'sometimes'
        }));
        ok(/fool sometimes/.test(div.innerHTML), 'has fool sometimes' + div.innerHTML);
    });
    test('return renderer', function () {
        var directResult = can.view.stache('renderer_test', 'This is a {{test}}');
        var renderer = can.view('renderer_test');
        ok(can.isFunction(directResult), 'Renderer returned directly');
        ok(can.isFunction(renderer), 'Renderer is a function');
        equal(getStringResult(renderer({ test: 'working test' })), 'This is a working test', 'Rendered');
        renderer = can.view(can.test.path('view/test/template.stache'));
        ok(can.isFunction(renderer), 'Renderer is a function');
        equal(getStringResult(renderer({ message: 'Rendered!' })), '<h3>Rendered!</h3>', 'Synchronous template loaded and rendered');
    });
    test('nameless renderers (#162, #195)', 3, function () {
        var nameless = can.stache('<h2>{{message}}</h2>'), data = { message: 'HI!' }, result = nameless(data), node = result.childNodes[0];
        ok('ownerDocument' in result, 'Result is a document fragment');
        equal(node.tagName.toLowerCase(), 'h2', 'Got h2 rendered');
        equal(node.innerHTML, data.message, 'Got result rendered');
    });
    test('deferred resolves with data (#183, #209)', function () {
        var foo = new can.Deferred();
        var bar = new can.Deferred();
        var original = {
            foo: foo,
            bar: bar
        };
        stop();
        ok(can.isDeferred(original.foo), 'Original foo property is a Deferred');
        can.view(can.test.path('view/test/deferred.stache'), original).then(function (result, data) {
            ok(data, 'Data exists');
            equal(data.foo, 'FOO', 'Foo is resolved');
            equal(data.bar, 'BAR', 'Bar is resolved');
            ok(can.isDeferred(original.foo), 'Original property did not get modified');
            start();
        });
        setTimeout(function () {
            foo.resolve('FOO');
        }, 100);
        setTimeout(function () {
            bar.resolve('BAR');
        }, 50);
    });
    test('Empty model displays __!!__ as input values (#196)', function () {
        can.view.stache('test196', 'User id: {{user.id}}' + ' User name: {{user.name}}');
        var frag = can.view('test196', { user: new can.Map() });
        var div = document.createElement('div');
        div.appendChild(frag);
        equal(div.innerHTML, 'User id:  User name: ', 'Got expected HTML content');
        can.view('test196', { user: new can.Map() }, function (frag) {
            div = document.createElement('div');
            div.appendChild(frag);
            equal(div.innerHTML, 'User id:  User name: ', 'Got expected HTML content in callback as well');
        });
    });
    test('Select live bound options don\'t contain __!!__', function () {
        var domainList = new can.List([
                {
                    id: 1,
                    name: 'example.com'
                },
                {
                    id: 2,
                    name: 'google.com'
                },
                {
                    id: 3,
                    name: 'yahoo.com'
                },
                {
                    id: 4,
                    name: 'microsoft.com'
                }
            ]), frag = can.view(can.test.path('view/test/select.stache'), { domainList: domainList }), div = document.createElement('div');
        div.appendChild(frag);
        can.append(can.$('#qunit-fixture'), div);
        equal(div.outerHTML.match(/__!!__/g), null, 'No __!!__ contained in HTML content');
    });
    test('Live binding on number inputs', function () {
        var template = can.stache('<input id="candy" type="number" {($value)}="number" />');
        var observe = new can.Map({ number: 2 });
        var frag = template(observe);
        can.append(can.$('#qunit-fixture'), frag);
        var input = document.getElementById('candy');
        equal(input.getAttribute('value'), 2, 'render workered');
        observe.attr('number', 5);
        equal(input.getAttribute('value'), 5, 'update workered');
    });
    test('live binding textNodes before a table', function () {
        var data = new can.Map({ loading: true }), templates = { 'stache': '{{#if state.loading}}Loading{{else}}Loaded{{/if}}<table><tbody><tr></tr></tbody></table>' };
        can.each(['stache'], function (ext) {
            var result = can[ext](templates[ext])({ state: data });
            equal(result.childNodes.length, 2, 'can.' + ext + '(template)(data) ' + 'proper number of nodes');
            equal(result.childNodes[0].nodeType, 3, 'can.' + ext + '(template)(data) ' + 'got text node');
            equal(result.childNodes[0].nodeValue, 'Loading', 'can.' + ext + '(template)(data) ' + 'got live bound text value');
            equal(result.childNodes[1].nodeName.toLowerCase(), 'table', ext + ' can.' + ext + '(template)(data) ' + 'innerHTML');
        });
    });
    test('Resetting a live-bound <textarea> changes its value to __!!__ (#223)', function () {
        var template = can.view.stache('<form><textarea>{{test}}</textarea></form>'), frag = template(new can.Map({ test: 'testing' })), form, textarea;
        can.append(can.$('#qunit-fixture'), frag);
        form = document.getElementById('qunit-fixture').getElementsByTagName('form')[0];
        textarea = form.children[0];
        equal(textarea.value, 'testing', 'Textarea value set');
        textarea.value = 'blabla';
        equal(textarea.value, 'blabla', 'Textarea value updated');
        form.reset();
        equal(form.children[0].value, 'testing', 'Textarea value set back to original live-bound value');
    });
    test('Deferred fails (#276)', function () {
        var foo = new can.Deferred();
        stop();
        can.view.render(can.test.path('view/test/deferred.stache'), foo).fail(function (error) {
            equal(error.message, 'Deferred error');
            start();
        });
        setTimeout(function () {
            foo.reject({ message: 'Deferred error' });
        }, 100);
    });
    test('Object of deferreds fails (#276)', function () {
        var foo = new can.Deferred(), bar = new can.Deferred();
        stop();
        can.view.render(can.test.path('view/test//deferreds.stache'), {
            foo: typeof foo.promise === 'function' ? foo.promise() : foo,
            bar: bar
        }).fail(function (error) {
            equal(error.message, 'foo error');
            start();
        });
        setTimeout(function () {
            foo.reject({ message: 'foo error' });
        }, 100);
        bar.resolve('Bar done');
    });
    test('Using \'=\' in attribute does not truncate the value', function () {
        var template = can.stache('<img id=\'equalTest\' {{class}} src="{{src}}">'), obs = new can.Map({
                'class': 'class="someClass"',
                'src': 'http://canjs.us/scripts/static/img/canjs_logo_yellow_small.png'
            }), frag = template(obs), img;
        can.append(can.$('#qunit-fixture'), frag);
        img = document.getElementById('equalTest');
        obs.attr('class', 'class="do=not=truncate=me"');
        obs.attr('src', 'http://canjs.us/scripts/static/img/canjs_logo_yellow_small.png?wid=100&wid=200');
        equal(img.className, 'do=not=truncate=me', 'class is right');
        equal(img.src, 'http://canjs.us/scripts/static/img/canjs_logo_yellow_small.png?wid=100&wid=200', 'attribute is right');
    });
    test('basic scanner custom tags', function () {
        can.view.tag('panel', function (el, tagData) {
            ok(tagData.options.attr('helpers.myhelper')(), 'got a helper');
            equal(tagData.scope.attr('foo'), 'bar', 'got scope and can read from it');
            equal(getStringResult(tagData.subtemplate(tagData.scope.add({ message: 'hi' })), tagData.options), '<p>sub says hi</p>');
        });
        var template = can.stache('<panel title=\'foo\'><p>sub says {{message}}</p></panel>');
        template({ foo: 'bar' }, {
            myhelper: function () {
                return true;
            }
        });
    });
    test('custom tags without subtemplate', function () {
        can.view.tag('empty-tag', function (el, tagData) {
            ok(!tagData.subtemplate, 'There is no subtemplate');
        });
        var template = can.stache('<empty-tag title=\'foo\'></empty-tag>');
        template({ foo: 'bar' });
    });
    test('sub hookup', function () {
        var tabs = document.createElement('tabs');
        document.body.appendChild(tabs);
        var panel = document.createElement('panel');
        document.body.appendChild(panel);
        can.view.tag('tabs', function (el, tagData) {
            var frag = can.view.frag(tagData.subtemplate(tagData.scope, tagData.options));
            var div = document.createElement('div');
            div.appendChild(frag);
            var panels = div.getElementsByTagName('panel');
            equal(panels.length, 1, 'there is one panel');
            equal(panels[0].nodeName.toUpperCase(), 'PANEL');
            equal(panels[0].getAttribute('title'), 'Fruits', 'attribute left correctly');
            equal(panels[0].innerHTML, 'oranges, apples', 'innerHTML');
        });
        can.view.tag('panel', function (el, tagData) {
            ok(tagData.scope, 'got scope');
            return tagData.scope;
        });
        var template = can.stache('<tabs>' + '{{#each foodTypes}}' + '<panel title=\'{{title}}\'>{{content}}</panel>' + '{{/each}}' + '</tabs>');
        var foodTypes = new can.List([{
                title: 'Fruits',
                content: 'oranges, apples'
            }]);
        template({ foodTypes: foodTypes });
    });
    test('sub hookup passes helpers', function () {
        can.view.tag('tabs', function (el, tagData) {
            var optionsScope = tagData.options.add({
                tabsHelper: function () {
                    return 'TabsHelper';
                }
            });
            var frag = can.view.frag(tagData.subtemplate(tagData.scope, optionsScope));
            var div = document.createElement('div');
            div.appendChild(frag);
            var panels = div.getElementsByTagName('panel');
            equal(panels.length, 1, 'there is one panel');
            equal(panels[0].nodeName.toUpperCase(), 'PANEL');
            equal(panels[0].getAttribute('title'), 'Fruits', 'attribute left correctly');
            equal(panels[0].innerHTML, 'TabsHelperoranges, apples', 'innerHTML');
        });
        can.view.tag('panel', function (el, tagData) {
            ok(tagData.scope, 'got scope');
            return tagData.scope;
        });
        var template = can.stache('<tabs>' + '{{#each foodTypes}}' + '<panel title=\'{{title}}\'>{{tabsHelper}}{{content}}</panel>' + '{{/each}}' + '</tabs>');
        var foodTypes = new can.List([{
                title: 'Fruits',
                content: 'oranges, apples'
            }]);
        template({ foodTypes: foodTypes });
    });
    test('attribute matching', function () {
        var item = 0;
        can.view.attr('on-click', function (el, attrData) {
            ok(true, 'attribute called');
            equal(attrData.attributeName, 'on-click', 'attr is on click');
            equal(el.nodeName.toLowerCase(), 'p', 'got a paragraph');
            var cur = attrData.scope.attr('.');
            equal(foodTypes[item], cur, 'can get the current scope');
            var attr = el.getAttribute('on-click');
            equal(attrData.scope.get(attr, { proxyMethods: false }), doSomething, 'can call a parent\'s function');
            item++;
        });
        var template = can.stache('<div>' + '{{#each foodTypes}}' + '<p on-click=\'doSomething\'>{{content}}</p>' + '{{/each}}' + '</div>');
        var foodTypes = new can.List([
            {
                title: 'Fruits',
                content: 'oranges, apples'
            },
            {
                title: 'Breads',
                content: 'pasta, cereal'
            },
            {
                title: 'Sweets',
                content: 'ice cream, candy'
            }
        ]);
        var doSomething = function () {
        };
        template({
            foodTypes: foodTypes,
            doSomething: doSomething
        });
    });
    test('regex attribute matching', function () {
        var item = 0;
        can.view.attr(/on-[\w\.]+/, function (el, attrData) {
            ok(true, 'attribute called');
            equal(attrData.attributeName, 'on-click', 'attr is on click');
            equal(el.nodeName.toLowerCase(), 'p', 'got a paragraph');
            var cur = attrData.scope.attr('.');
            equal(foodTypes[item], cur, 'can get the current scope');
            var attr = el.getAttribute('on-click');
            equal(attrData.scope.get(attr, { proxyMethods: false }), doSomething, 'can call a parent\'s function');
            item++;
        });
        var template = can.stache('<div>' + '{{#each foodTypes}}' + '<p on-click=\'doSomething\'>{{content}}</p>' + '{{/each}}' + '</div>');
        var foodTypes = new can.List([
            {
                title: 'Fruits',
                content: 'oranges, apples'
            },
            {
                title: 'Breads',
                content: 'pasta, cereal'
            },
            {
                title: 'Sweets',
                content: 'ice cream, candy'
            }
        ]);
        var doSomething = function () {
        };
        template({
            foodTypes: foodTypes,
            doSomething: doSomething
        });
    });
    test('content element', function () {
        var template = can.stache('{{#foo}}<content></content>{{/foo}}');
        var context = new can.Map({ foo: 'bar' });
        can.view.tag('content', function (el, options) {
            equal(el.nodeName.toLowerCase(), 'content', 'got an element');
            equal(options.scope.attr('.'), 'bar', 'got the context of content');
            el.innerHTML = 'updated';
        });
        var frag = template(context);
        equal(frag.childNodes[0].nodeName.toLowerCase(), 'content', 'found content element');
        equal(frag.childNodes[0].innerHTML, 'updated', 'content is updated');
        context.removeAttr('foo');
        equal(frag.childNodes[0].nodeType, 3, 'only a text element remains');
        context.attr('foo', 'bar');
        equal(frag.childNodes[0].nodeName.toLowerCase(), 'content');
        equal(frag.childNodes[0].innerHTML, 'updated', 'content is updated');
    });
    test('content element inside tbody', function () {
        var template = can.stache('<table><tbody><content></content></tbody></table>');
        var context = new can.Map({ foo: 'bar' });
        can.view.tag('content', function (el, options) {
            equal(el.parentNode.nodeName.toLowerCase(), 'tbody', 'got an element in a tbody');
            equal(options.scope.attr('.'), context, 'got the context of content');
        });
        template(context);
    });
    test('extensionless views, enforcing engine (#193)', 1, function () {
        var path = can.test.path('view/test/extensionless');
        if (path.indexOf('.js', this.length - 3) !== -1) {
            path = path.substring(0, path.lastIndexOf('/'));
        }
        var frag = can.view({
            url: path,
            engine: 'stache'
        }, { message: 'Hi test' });
        var div = document.createElement('div');
        div.appendChild(frag);
        equal(div.getElementsByTagName('h3')[0].innerHTML, 'Hi test', 'Got expected test from extensionless template');
    });
    test('can.view[engine] always returns fragment renderers (#485)', 2, function () {
        var template = '<h1>{{message}}</h1>';
        var withId = can.stache('test-485', template);
        var withoutId = can.stache(template);
        ok(withoutId({ message: 'Without id' }).nodeType === 11, 'View without id returned document fragment');
        ok(withId({ message: 'With id' }).nodeType === 11, 'View with id returned document fragment');
    });
    test('create a template before the custom element works with slash and colon', function () {
        if (window.html5) {
            ok(true, 'Old IE');
            return;
        }
        can.stache('theid', '<unique-name></unique-name><can:something></can:something><ignore-this>content</ignore-this>');
        can.view.tag('unique-name', function (el, tagData) {
            ok(true, 'unique-name called!');
        });
        can.view.tag('can:something', function (el, tagData) {
            ok(true, 'can:something called!');
        });
        can.view('theid', {});
    });
    test('loaded live element test', function () {
        if (window.html5) {
            window.html5.elements += ' my-el';
            window.html5.shivDocument();
        }
        var t = can.stache('<div><my-el {{#if foo}}checked{{/if}} class=\'{{bar}}\' >inner</my-el></div>');
        t();
        ok(true);
    });
    test('content within non-component tags gets rendered with context', function () {
        if (window.html5) {
            window.html5.elements += ' unique-element-name';
            window.html5.shivDocument();
        }
        var tmp = can.stache('<div><unique-element-name>{{name}}</unique-element-name></div>');
        var frag = tmp({ name: 'Josh M' });
        equal(frag.childNodes[0].childNodes[0].innerHTML, 'Josh M', 'correctly retrieved scope data');
    });
    test('empty non-component tags', function () {
        if (window.html5) {
            window.html5.elements += ' unique-element-name';
            window.html5.shivDocument();
        }
        var tmp = can.stache('<div><unique-element-name></unique-element-name></div>');
        tmp();
        ok(true, 'no error');
    });
    if (window.require) {
        if (window.require.config && window.require.toUrl) {
            test('template files relative to requirejs baseUrl (#647)', function () {
                can.view.ext = '.stache';
                var oldBaseUrl = window.requirejs.s.contexts._.config.baseUrl;
                window.require.config({ baseUrl: oldBaseUrl + '/view/test/' });
                ok(can.isFunction(can.view('template')));
                window.require.config({ baseUrl: oldBaseUrl });
            });
        }
    }
    test('should not error with IE conditional compilation turned on (#679)', function () {
        var pass = true;
        var template = can.stache('Hello World');
        try {
            template({});
        } catch (e) {
            pass = false;
        }
        ok(pass);
    });
    test('renderer passed with Deferred gets executed (#1139)', 1, function () {
        var template = can.stache('<h1>Value is {{value}}!</h1>');
        var def = can.Deferred();
        stop();
        setTimeout(function () {
            def.resolve({ value: 'Test' });
        }, 50);
        can.view(template, def, function (frag) {
            equal(frag.childNodes[0].innerHTML, 'Value is Test!');
            start();
        });
    });
    test('live lists are rendered properly when batch updated (#680)', function () {
        var div1 = document.createElement('div'), template = '{{#if items.length}}<ul>{{#each items}}<li>{{.}}</li>{{/each}}</ul>{{/if}}', stacheTempl = can.stache(template);
        var data = { items: new can.List() };
        div1.appendChild(stacheTempl(data));
        can.batch.start();
        for (var i = 1; i <= 3; i++) {
            data.items.push(i);
        }
        can.batch.stop();
        var getLIText = function (el) {
            var items = el.querySelectorAll('li');
            var text = '';
            can.each(items, function (item) {
                text += item.firstChild.data;
            });
            return text;
        };
        equal(getLIText(div1), '123', 'Batched lists rendered properly with stache.');
    });
    test('hookups on self-closing elements do not leave orphaned @@!!@@ text content (#1113)', function () {
        var list = new can.List([
                {},
                {}
            ]), templates = { 'stache': '<table><colgroup>{{#list}}<col/>{{/list}}</colgroup></table>' };
        can.each(['stache'], function (ext) {
            var frag = can[ext](templates[ext])({ list: list }), div = document.createElement('div');
            div.appendChild(frag);
            equal(div.querySelectorAll('col').length, 2, 'Hookup with self-closing tag rendered properly with ' + ext);
            equal(div.innerHTML.indexOf('@@!!@@'), -1, 'Hookup with self-closing tag did not leave orphaned @@!!@@ text content with ' + ext);
        });
    });
});
/*can@2.3.18#view/stache/expression.js*/
define('can/view/stache/expression.js', function (require, exports, module) {
    var can = require('can/util/util');
    var utils = require('can/view/stache/utils');
    var mustacheHelpers = require('can/view/stache/mustache_helpers');
    require('can/view/scope/scope');
    var getKeyComputeData = function (key, scope, readOptions) {
            var data = scope.computeData(key, readOptions);
            can.compute.temporarilyBind(data.compute);
            return data;
        }, lookupValue = function (key, scope, helperOptions, readOptions) {
            var computeData = getKeyComputeData(key, scope, readOptions);
            if (!computeData.compute.computeInstance.hasDependencies) {
                return {
                    value: computeData.initialValue,
                    computeData: computeData
                };
            } else {
                return {
                    value: computeData.compute,
                    computeData: computeData
                };
            }
        }, lookupValueOrHelper = function (key, scope, helperOptions, readOptions) {
            var res = lookupValue(key, scope, helperOptions, readOptions);
            if (res.computeData.initialValue === undefined) {
                if (key.charAt(0) === '@' && key !== '@index') {
                    key = key.substr(1);
                }
                var helper = mustacheHelpers.getHelper(key, helperOptions);
                res.helper = helper && helper.fn;
            }
            return res;
        }, convertToArgExpression = function (expr) {
            if (!(expr instanceof Arg) && !(expr instanceof Literal)) {
                return new Arg(expr);
            } else {
                return expr;
            }
        };
    var Literal = function (value) {
        this._value = value;
    };
    Literal.prototype.value = function () {
        return this._value;
    };
    var Lookup = function (key, root) {
        this.key = key;
        this.rootExpr = root;
    };
    Lookup.prototype.value = function (scope, helperOptions) {
        var result = lookupValueOrHelper(this.key, scope, helperOptions);
        this.isHelper = result.helper && !result.helper.callAsMethod;
        return result.helper || result.value;
    };
    var ScopeLookup = function (key, root) {
        Lookup.apply(this, arguments);
    };
    ScopeLookup.prototype.value = function (scope, helperOptions) {
        return lookupValue(this.key, scope, helperOptions).value;
    };
    var Arg = function (expression, modifiers) {
        this.expr = expression;
        this.modifiers = modifiers || {};
        this.isCompute = false;
    };
    Arg.prototype.value = function () {
        return this.expr.value.apply(this.expr, arguments);
    };
    var Hash = function () {
    };
    var Call = function (methodExpression, argExpressions, hashExpressions) {
        this.methodExpr = methodExpression;
        this.argExprs = can.map(argExpressions, convertToArgExpression);
        var hashExprs = this.hashExprs = {};
        can.each(hashExpressions, function (expr, name) {
            hashExprs[name] = convertToArgExpression(expr);
        });
    };
    Call.prototype.args = function (scope, helperOptions) {
        var args = [];
        for (var i = 0, len = this.argExprs.length; i < len; i++) {
            var arg = this.argExprs[i];
            var value = arg.value.apply(arg, arguments);
            args.push({
                call: value && value.isComputed && !arg.modifiers.compute,
                value: value
            });
        }
        return function () {
            var finalArgs = [];
            for (var i = 0, len = args.length; i < len; i++) {
                finalArgs[i] = args[i].call ? args[i].value() : args[i].value;
            }
            return finalArgs;
        };
    };
    Call.prototype.hash = function (scope, helperOptions) {
        var hash = {};
        for (var prop in this.hashExprs) {
            var val = this.hashExprs[prop], value = val.value.apply(val, arguments);
            hash[prop] = {
                call: value && value.isComputed && !val.modifiers.compute,
                value: value
            };
        }
        return function () {
            var finalHash = {};
            for (var prop in hash) {
                finalHash[prop] = hash[prop].call ? hash[prop].value() : hash[prop].value;
            }
            return finalHash;
        };
    };
    Call.prototype.value = function (scope, helperScope, helperOptions) {
        var method = this.methodExpr.value(scope, helperScope);
        this.isHelper = this.methodExpr.isHelper;
        var hasHash = !can.isEmptyObject(this.hashExprs), getArgs = this.args(scope, helperScope), getHash = this.hash(scope, helperScope);
        return can.compute(function (newVal) {
            var func = method;
            if (func && func.isComputed) {
                func = func();
            }
            if (typeof func === 'function') {
                var args = getArgs();
                if (hasHash) {
                    args.push(getHash());
                }
                if (helperOptions) {
                    args.push(helperOptions);
                }
                if (arguments.length) {
                    args.unshift(new expression.SetIdentifier(newVal));
                }
                return func.apply(null, args);
            }
        });
    };
    var HelperLookup = function () {
        Lookup.apply(this, arguments);
    };
    HelperLookup.prototype.value = function (scope, helperOptions) {
        var result = lookupValueOrHelper(this.key, scope, helperOptions, {
            isArgument: true,
            args: [
                scope.attr('.'),
                scope
            ]
        });
        return result.helper || result.value;
    };
    var HelperScopeLookup = function () {
        Lookup.apply(this, arguments);
    };
    HelperScopeLookup.prototype.value = function (scope, helperOptions) {
        return lookupValue(this.key, scope, helperOptions, {
            callMethodsOnObservables: true,
            isArgument: true,
            args: [
                scope.attr('.'),
                scope
            ]
        }).value;
    };
    var Helper = function (methodExpression, argExpressions, hashExpressions) {
        this.methodExpr = methodExpression;
        this.argExprs = argExpressions;
        this.hashExprs = hashExpressions;
        this.mode = null;
    };
    Helper.prototype.args = function (scope, helperOptions) {
        var args = [];
        for (var i = 0, len = this.argExprs.length; i < len; i++) {
            var arg = this.argExprs[i];
            args.push(arg.value.apply(arg, arguments));
        }
        return args;
    };
    Helper.prototype.hash = function (scope, helperOptions) {
        var hash = {};
        for (var prop in this.hashExprs) {
            var val = this.hashExprs[prop];
            hash[prop] = val.value.apply(val, arguments);
        }
        return hash;
    };
    Helper.prototype.helperAndValue = function (scope, helperOptions) {
        var looksLikeAHelper = this.argExprs.length || !can.isEmptyObject(this.hashExprs), helper, value, methodKey = this.methodExpr instanceof Literal ? '' + this.methodExpr._value : this.methodExpr.key, initialValue, args;
        if (looksLikeAHelper) {
            helper = mustacheHelpers.getHelper(methodKey, helperOptions);
            var context = scope.attr('.');
            if (!helper && typeof context[methodKey] === 'function') {
                helper = { fn: context[methodKey] };
            }
        }
        if (!helper) {
            args = this.args(scope, helperOptions);
            var computeData = getKeyComputeData(methodKey, scope, {
                    isArgument: false,
                    args: args && args.length ? args : [
                        scope.attr('.'),
                        scope
                    ]
                }), compute = computeData.compute;
            initialValue = computeData.initialValue;
            if (computeData.compute.computeInstance.hasDependencies) {
                value = compute;
            } else {
                value = initialValue;
            }
            if (!looksLikeAHelper && initialValue === undefined) {
                helper = mustacheHelpers.getHelper(methodKey, helperOptions);
            }
        }
        return {
            value: value,
            args: args,
            helper: helper && helper.fn
        };
    };
    Helper.prototype.evaluator = function (helper, scope, helperOptions, readOptions, nodeList, truthyRenderer, falseyRenderer, stringOnly) {
        var helperOptionArg = {
                fn: function () {
                },
                inverse: function () {
                }
            }, context = scope.attr('.'), args = this.args(scope, helperOptions, nodeList, truthyRenderer, falseyRenderer, stringOnly), hash = this.hash(scope, helperOptions, nodeList, truthyRenderer, falseyRenderer, stringOnly);
        utils.convertToScopes(helperOptionArg, scope, helperOptions, nodeList, truthyRenderer, falseyRenderer);
        can.simpleExtend(helperOptionArg, {
            context: context,
            scope: scope,
            contexts: scope,
            hash: hash,
            nodeList: nodeList,
            exprData: this,
            helperOptions: helperOptions,
            helpers: helperOptions
        });
        args.push(helperOptionArg);
        return function () {
            return helper.apply(context, args);
        };
    };
    Helper.prototype.value = function (scope, helperOptions, nodeList, truthyRenderer, falseyRenderer, stringOnly) {
        var helperAndValue = this.helperAndValue(scope, helperOptions);
        var helper = helperAndValue.helper;
        if (!helper) {
            return helperAndValue.value;
        }
        var fn = this.evaluator(helper, scope, helperOptions, nodeList, truthyRenderer, falseyRenderer, stringOnly);
        var compute = can.compute(fn);
        can.compute.temporarilyBind(compute);
        if (!compute.computeInstance.hasDependencies) {
            return compute();
        } else {
            return compute;
        }
    };
    var keyRegExp = /[\w\.\\\-_@\/\&%]+/, tokensRegExp = /('.*?'|".*?"|=|[\w\.\\\-_@\/*%\$]+|[\(\)]|,|\~)/g, literalRegExp = /^('.*?'|".*?"|[0-9]+\.?[0-9]*|true|false|null|undefined)$/;
    var isTokenKey = function (token) {
        return keyRegExp.test(token);
    };
    var testDot = /^[\.@]\w/;
    var isAddingToExpression = function (token) {
        return isTokenKey(token) && testDot.test(token);
    };
    var ensureChildren = function (type) {
        if (!type.children) {
            type.children = [];
        }
        return type;
    };
    var Stack = function () {
        this.root = {
            children: [],
            type: 'Root'
        };
        this.current = this.root;
        this.stack = [this.root];
    };
    can.simpleExtend(Stack.prototype, {
        top: function () {
            return can.last(this.stack);
        },
        isRootTop: function () {
            return this.top() === this.root;
        },
        popTo: function (types) {
            this.popUntil(types);
            if (!this.isRootTop()) {
                this.stack.pop();
            }
        },
        firstParent: function (types) {
            var curIndex = this.stack.length - 2;
            while (curIndex > 0 && can.inArray(this.stack[curIndex].type, types) === -1) {
                curIndex--;
            }
            return this.stack[curIndex];
        },
        popUntil: function (types) {
            while (can.inArray(this.top().type, types) === -1 && !this.isRootTop()) {
                this.stack.pop();
            }
            return this.top();
        },
        addTo: function (types, type) {
            var cur = this.popUntil(types);
            ensureChildren(cur).children.push(type);
        },
        addToAndPush: function (types, type) {
            this.addTo(types, type);
            this.stack.push(type);
        },
        topLastChild: function () {
            return can.last(this.top().children);
        },
        replaceTopLastChild: function (type) {
            var children = ensureChildren(this.top()).children;
            children.pop();
            children.push(type);
            return type;
        },
        replaceTopLastChildAndPush: function (type) {
            this.replaceTopLastChild(type);
            this.stack.push(type);
        },
        replaceTopAndPush: function (type) {
            var children;
            if (this.top() === this.root) {
                children = ensureChildren(this.top()).children;
            } else {
                this.stack.pop();
                children = ensureChildren(this.top()).children;
            }
            children.pop();
            children.push(type);
            this.stack.push(type);
            return type;
        }
    });
    var convertKeyToLookup = function (key) {
        var lastPath = key.lastIndexOf('./');
        var lastDot = key.lastIndexOf('.');
        if (lastDot > lastPath) {
            return key.substr(0, lastDot) + '@' + key.substr(lastDot + 1);
        }
        var firstNonPathCharIndex = lastPath === -1 ? 0 : lastPath + 2;
        var firstNonPathChar = key.charAt(firstNonPathCharIndex);
        if (firstNonPathChar === '.' || firstNonPathChar === '@') {
            return key.substr(0, firstNonPathCharIndex) + '@' + key.substr(firstNonPathCharIndex + 1);
        } else {
            return key.substr(0, firstNonPathCharIndex) + '@' + key.substr(firstNonPathCharIndex);
        }
    };
    var convertToAtLookup = function (ast) {
        if (ast.type === 'Lookup') {
            ast.key = convertKeyToLookup(ast.key);
        }
        return ast;
    };
    var convertToHelperIfTopIsLookup = function (stack) {
        var top = stack.top();
        if (top && top.type === 'Lookup') {
            var base = stack.stack[stack.stack.length - 2];
            if (base.type !== 'Helper' && base) {
                stack.replaceTopAndPush({
                    type: 'Helper',
                    method: top
                });
            }
        }
    };
    var expression = {
        convertKeyToLookup: convertKeyToLookup,
        Literal: Literal,
        Lookup: Lookup,
        ScopeLookup: ScopeLookup,
        Arg: Arg,
        Hash: Hash,
        Call: Call,
        Helper: Helper,
        HelperLookup: HelperLookup,
        HelperScopeLookup: HelperScopeLookup,
        SetIdentifier: function (value) {
            this.value = value;
        },
        tokenize: function (expression) {
            var tokens = [];
            (can.trim(expression) + ' ').replace(tokensRegExp, function (whole, arg) {
                tokens.push(arg);
            });
            return tokens;
        },
        lookupRules: {
            'default': function (ast, methodType, isArg) {
                var name = (methodType === 'Helper' && !ast.root ? 'Helper' : '') + (isArg ? 'Scope' : '') + 'Lookup';
                return expression[name];
            },
            'method': function (ast, methodType, isArg) {
                return ScopeLookup;
            }
        },
        methodRules: {
            'default': function (ast) {
                return ast.type === 'Call' ? Call : Helper;
            },
            'call': function (ast) {
                return Call;
            }
        },
        parse: function (expressionString, options) {
            options = options || {};
            var ast = this.ast(expressionString);
            if (!options.lookupRule) {
                options.lookupRule = 'default';
            }
            if (typeof options.lookupRule === 'string') {
                options.lookupRule = expression.lookupRules[options.lookupRule];
            }
            if (!options.methodRule) {
                options.methodRule = 'default';
            }
            if (typeof options.methodRule === 'string') {
                options.methodRule = expression.methodRules[options.methodRule];
            }
            var expr = this.hydrateAst(ast, options, options.baseMethodType || 'Helper');
            return expr;
        },
        hydrateAst: function (ast, options, methodType, isArg) {
            if (ast.type === 'Lookup') {
                return new (options.lookupRule(ast, methodType, isArg))(ast.key, ast.root && this.hydrateAst(ast.root, options, methodType));
            } else if (ast.type === 'Literal') {
                return new Literal(ast.value);
            } else if (ast.type === 'Arg') {
                return new Arg(this.hydrateAst(ast.children[0], options, methodType, isArg), { compute: true });
            } else if (ast.type === 'Hash') {
                throw new Error('');
            } else if (ast.type === 'Call' || ast.type === 'Helper') {
                var hashes = {}, args = [], children = ast.children;
                if (children) {
                    for (var i = 0; i < children.length; i++) {
                        var child = children[i];
                        if (child.type === 'Hash') {
                            hashes[child.prop] = this.hydrateAst(child.children[0], options, ast.type, true);
                        } else {
                            args.push(this.hydrateAst(child, options, ast.type, true));
                        }
                    }
                }
                return new (options.methodRule(ast))(this.hydrateAst(ast.method, options, ast.type), args, hashes);
            }
        },
        ast: function (expression) {
            var tokens = this.tokenize(expression);
            return this.parseAst(tokens, { index: 0 });
        },
        parseAst: function (tokens, cursor) {
            var stack = new Stack(), top;
            while (cursor.index < tokens.length) {
                var token = tokens[cursor.index], nextToken = tokens[cursor.index + 1];
                cursor.index++;
                if (literalRegExp.test(token)) {
                    convertToHelperIfTopIsLookup(stack);
                    stack.addTo([
                        'Helper',
                        'Call',
                        'Hash'
                    ], {
                        type: 'Literal',
                        value: utils.jsonParse(token)
                    });
                } else if (nextToken === '=') {
                    top = stack.top();
                    if (top && top.type === 'Lookup') {
                        var firstParent = stack.firstParent([
                            'Call',
                            'Helper',
                            'Hash'
                        ]);
                        if (firstParent.type === 'Call' || firstParent.type === 'Root') {
                            stack.popUntil(['Call']);
                            top = stack.top();
                            stack.replaceTopAndPush({
                                type: 'Helper',
                                method: top.type === 'Root' ? can.last(top.children) : top
                            });
                        }
                    }
                    stack.addToAndPush([
                        'Helper',
                        'Call'
                    ], {
                        type: 'Hash',
                        prop: token
                    });
                    cursor.index++;
                } else if (keyRegExp.test(token)) {
                    var last = stack.topLastChild();
                    if (last && last.type === 'Call' && isAddingToExpression(token)) {
                        stack.replaceTopLastChildAndPush({
                            type: 'Lookup',
                            root: last,
                            key: token
                        });
                    } else {
                        convertToHelperIfTopIsLookup(stack);
                        stack.addToAndPush([
                            'Helper',
                            'Call',
                            'Hash',
                            'Arg'
                        ], {
                            type: 'Lookup',
                            key: token
                        });
                    }
                } else if (token === '~') {
                    convertToHelperIfTopIsLookup(stack);
                    stack.addToAndPush([
                        'Helper',
                        'Call',
                        'Hash'
                    ], {
                        type: 'Arg',
                        key: token
                    });
                } else if (token === '(') {
                    top = stack.top();
                    if (top.type === 'Lookup') {
                        stack.replaceTopAndPush({
                            type: 'Call',
                            method: convertToAtLookup(top)
                        });
                    } else {
                        throw new Error('Unable to understand expression ' + tokens.join(''));
                    }
                } else if (token === ')') {
                    stack.popTo(['Call']);
                } else if (token === ',') {
                    stack.popUntil(['Call']);
                }
            }
            return stack.root.children[0];
        }
    };
    can.expression = expression;
    module.exports = expression;
});
/*can@2.3.18#view/stache/expression_test*/
define('can/view/stache/expression_test', function (require, exports, module) {
    var can = require('can/util/util');
    require('can/view/stache/expression.js');
    require('steal-qunit');
    var expression = can.expression;
    QUnit.module('can/view/stache/expression');
    test('expression.tokenize', function () {
        var literals = '\'quote\' "QUOTE" 1 undefined null true false 0.1';
        var res = expression.tokenize(literals);
        deepEqual(res, literals.split(' '));
        var keys = 'key foo.bar foo@bar %foo *foo foo/bar';
        res = expression.tokenize(keys);
        deepEqual(res, keys.split(' '));
        var syntax = '( ) , ~ =';
        res = expression.tokenize(syntax);
        deepEqual(res, syntax.split(' '));
        var curly = '{{ }}';
        res = expression.tokenize(curly);
        deepEqual(res, []);
    });
    test('expression.ast - helper followed by hash', function () {
        var ast = expression.ast('print_hash prop=own_prop');
        deepEqual(ast, {
            type: 'Helper',
            method: {
                type: 'Lookup',
                key: 'print_hash'
            },
            children: [{
                    type: 'Hash',
                    prop: 'prop',
                    children: [{
                            type: 'Lookup',
                            key: 'own_prop'
                        }]
                }]
        });
    });
    test('expression.ast - everything', function () {
        var ast = expression.ast('helperA helperB(1, valueA, propA=~valueB propC=2).zed() \'def\' nested@prop outerPropA=helperC(2,valueB)');
        var helperBCall = {
            type: 'Call',
            method: {
                type: 'Lookup',
                key: '@helperB'
            },
            children: [
                {
                    type: 'Literal',
                    value: 1
                },
                {
                    type: 'Lookup',
                    key: 'valueA'
                },
                {
                    type: 'Hash',
                    prop: 'propA',
                    children: [{
                            type: 'Arg',
                            key: '~',
                            children: [{
                                    type: 'Lookup',
                                    key: 'valueB'
                                }]
                        }]
                },
                {
                    type: 'Hash',
                    prop: 'propC',
                    children: [{
                            type: 'Literal',
                            value: 2
                        }]
                }
            ]
        };
        var helperCCall = {
            type: 'Call',
            method: {
                type: 'Lookup',
                key: '@helperC'
            },
            children: [
                {
                    type: 'Literal',
                    value: 2
                },
                {
                    type: 'Lookup',
                    key: 'valueB'
                }
            ]
        };
        deepEqual(ast, {
            type: 'Helper',
            method: {
                type: 'Lookup',
                key: 'helperA'
            },
            children: [
                {
                    type: 'Call',
                    method: {
                        type: 'Lookup',
                        root: helperBCall,
                        key: '@zed'
                    }
                },
                {
                    type: 'Literal',
                    value: 'def'
                },
                {
                    type: 'Lookup',
                    key: 'nested@prop'
                },
                {
                    type: 'Hash',
                    prop: 'outerPropA',
                    children: [helperCCall]
                }
            ]
        });
    });
    test('expression.parse - everything', function () {
        var exprData = expression.parse('helperA helperB(1, valueA, propA=~valueB propC=2).zed \'def\' nested@prop outerPropA=helperC(2,valueB)');
        var oneExpr = new expression.Literal(1), twoExpr = new expression.Literal(2), def = new expression.Literal('def'), valueA = new expression.ScopeLookup('valueA'), valueB = new expression.ScopeLookup('valueB'), nested = new expression.HelperScopeLookup('nested@prop'), helperA = new expression.HelperLookup('helperA'), helperB = new expression.Lookup('@helperB'), helperC = new expression.Lookup('@helperC');
        var callHelperB = new expression.Call(helperB, [
            oneExpr,
            valueA
        ], {
            propA: new expression.Arg(valueB, { compute: true }),
            propC: twoExpr
        });
        var callHelperBdotZed = new expression.ScopeLookup('.zed', callHelperB);
        var callHelperC = new expression.Call(helperC, [
            twoExpr,
            valueB
        ], {});
        var callHelperA = new expression.Helper(helperA, [
            callHelperBdotZed,
            def,
            nested
        ], { outerPropA: callHelperC });
        deepEqual(callHelperB, exprData.argExprs[0].rootExpr, 'call helper b');
        deepEqual(callHelperC, exprData.hashExprs.outerPropA, 'helperC call');
        deepEqual(callHelperBdotZed, exprData.argExprs[0], 'call helper b.zed');
        var expectedArgs = [
            callHelperBdotZed,
            def,
            nested
        ];
        can.each(exprData.argExprs, function (arg, i) {
            deepEqual(arg, expectedArgs[i], 'helperA arg[' + i);
        });
        deepEqual(exprData, callHelperA, 'full thing');
    });
    test('numeric expression.Literal', function () {
        var exprData = expression.parse('3');
        var result = new expression.Literal(3);
        deepEqual(exprData, result);
    });
    test('expression.Helper:value non-observable values', function () {
        var scope = new can.view.Scope({
            fullName: function (first, last) {
                return first + ' ' + last;
            }
        });
        var callFullName = new expression.Helper(new expression.HelperLookup('fullName'), [
            new expression.Literal('marshall'),
            new expression.Literal('thompson')
        ], {});
        var result = callFullName.value(scope, new can.view.Scope({}), {});
        equal(result, 'marshall thompson');
    });
    test('expression.Helper:value observable values', function () {
        var scope = new can.view.Scope({
            fullName: function (first, last) {
                return first() + ' ' + last;
            },
            first: can.compute('marshall')
        });
        var callFullName = new expression.Helper(new expression.HelperLookup('fullName'), [
            new expression.HelperLookup('first'),
            new expression.Literal('thompson')
        ], {});
        var result = callFullName.value(scope, new can.view.Scope({}));
        equal(result(), 'marshall thompson');
    });
    test('methods can return values (#1887)', function () {
        var MyMap = can.Map.extend({
            getSomething: function (arg) {
                return this.attr('foo') + arg();
            }
        });
        var scope = new can.view.Scope(new MyMap({
            foo: 2,
            bar: 3
        })).add({});
        var callGetSomething = new expression.Helper(new expression.HelperLookup('getSomething'), [new expression.ScopeLookup('bar')], {});
        var result = callGetSomething.value(scope, new can.view.Scope({}), { asCompute: true });
        equal(result(), 5);
    });
    test('methods don\'t update correctly (#1891)', function () {
        var map = new can.Map({
            num: 1,
            num2: function () {
                return this.attr('num') * 2;
            },
            runTest: function () {
                this.attr('num', this.attr('num') * 2);
            }
        });
        var scope = new can.view.Scope(map);
        var num2Expression = new expression.Lookup('num2');
        var num2 = num2Expression.value(scope, new can.view.Scope({}), { asCompute: true });
        num2.bind('change', function (ev, newVal) {
        });
        map.runTest();
        equal(num2(), 4, 'num2 updated correctly');
    });
    test('call expressions called with different scopes give different results (#1791)', function () {
        var exprData = expression.parse('doSomething(number)');
        var res = exprData.value(new can.view.Scope({
            doSomething: function (num) {
                return num * 2;
            },
            number: can.compute(2)
        }));
        equal(res(), 4);
        res = exprData.value(new can.view.Scope({
            doSomething: function (num) {
                return num * 3;
            },
            number: can.compute(4)
        }));
        equal(res(), 12);
    });
    test('convertKeyToLookup', function () {
        equal(expression.convertKeyToLookup('../foo'), '../@foo');
        equal(expression.convertKeyToLookup('foo'), '@foo');
        equal(expression.convertKeyToLookup('.foo'), '@foo');
        equal(expression.convertKeyToLookup('./foo'), './@foo');
        equal(expression.convertKeyToLookup('foo.bar'), 'foo@bar');
    });
});
/*view/stache/stache_test*/
define('can/view/stache/stache_test', function (require, exports, module) {
    var can = require('can/util/util');
    require('can/util/vdom/document/document');
    require('can/util/vdom/build_fragment/build_fragment');
    require('can/view/stache/stache');
    require('can/view/view');
    require('can/view/stache/expression_test');
    require('can/view/stache/mustache_helpers');
    require('can/test/test');
    require('steal-qunit');
    var browserDoc = window.document;
    var simpleDocument = can.simpleDocument;
    makeTest('can/view/stache dom', browserDoc);
    if (window.jQuery && window.steal) {
        makeTest('can/view/stache vdom', simpleDocument);
    }
    if (window.steal) {
        QUnit.asyncTest('routeUrl and routeCurrent helper', function () {
            makeIframe(can.test.path('view/stache/test/route-url-current.html?' + Math.random()));
        });
        QUnit.asyncTest('system/stache plugin accepts nodelists', function () {
            makeIframe(can.test.path('view/stache/test/system-nodelist.html?' + Math.random()));
        });
    }
    function makeIframe(src) {
        var iframe = document.createElement('iframe');
        window.removeMyself = function () {
            delete window.removeMyself;
            document.body.removeChild(iframe);
            start();
        };
        document.body.appendChild(iframe);
        iframe.src = src;
    }
    function makeTest(name, doc) {
        var isNormalDOM = doc === window.document;
        var innerHTML = function (node) {
            return 'innerHTML' in node ? node.innerHTML : undefined;
        };
        var getValue = function (node) {
            if (node.nodeName.toLowerCase() === 'textarea') {
                return innerHTML(node);
            } else {
                return node.value;
            }
        };
        var getChildNodes = function (node) {
            var childNodes = node.childNodes;
            if ('length' in childNodes) {
                return childNodes;
            } else {
                var cur = node.firstChild;
                var nodes = [];
                while (cur) {
                    nodes.push(cur);
                    cur = cur.nextSibling;
                }
                return nodes;
            }
        };
        var empty = function (node) {
            var last = node.lastChild;
            while (last) {
                node.removeChild(last);
                last = node.lastChild;
            }
        };
        var getText = function (template, data, options) {
                var div = doc.createElement('div');
                div.appendChild(can.stache(template)(data));
                return cleanHTMLTextForIE(innerHTML(div));
            }, getAttr = function (el, attrName) {
                return attrName === 'class' ? el.className : el.getAttribute(attrName);
            }, cleanHTMLTextForIE = function (html) {
                return html.replace(/ stache_0\.\d+="[^"]+"/g, '').replace(/<(\/?[-A-Za-z0-9_]+)/g, function (whole, tagName) {
                    return '<' + tagName.toLowerCase();
                }).replace(/\r?\n/g, '');
            }, getTextFromFrag = function (node) {
                var txt = '';
                node = node.firstChild;
                while (node) {
                    if (node.nodeType === 3) {
                        txt += node.nodeValue;
                    } else {
                        txt += getTextFromFrag(node);
                    }
                    node = node.nextSibling;
                }
                return txt;
            };
        var oldDoc;
        QUnit.module(name, {
            setup: function () {
                if (doc === window.document) {
                    can.document = undefined;
                } else {
                    oldDoc = can.document;
                    can.document = doc;
                }
                if (doc !== window.document) {
                    this.fixture = doc.createElement('div');
                    doc.body.appendChild(this.fixture);
                    this.$fixture = can.$(this.fixture);
                } else {
                    this.fixture = can.$('#qunit-fixture')[0];
                    this.$fixture = can.$('#qunit-fixture');
                }
                can.view.ext = '.stache';
                this.animals = [
                    'sloth',
                    'bear',
                    'monkey'
                ];
            },
            teardown: function () {
                if (doc !== window.document) {
                    can.document = oldDoc;
                    doc.body.removeChild(this.fixture);
                }
            }
        });
        test('html to html', function () {
            var stashed = can.stache('<h1 class=\'foo\'><span>Hello World!</span></h1>');
            var frag = stashed();
            equal(innerHTML(frag.childNodes.item(0)).toLowerCase(), '<span>hello world!</span>', 'got back the right text');
        });
        test('basic replacement', function () {
            var stashed = can.stache('<h1 class=\'foo\'><span>Hello {{message}}!</span></h1>');
            var frag = stashed({ message: 'World' });
            equal(innerHTML(frag.firstChild).toLowerCase(), '<span>hello world!</span>', 'got back the right text');
        });
        test('a section helper', function () {
            can.stache.registerHelper('helper', function (options) {
                return options.fn({ message: 'World' });
            });
            var stashed = can.stache('<h1 class=\'foo\'>{{#helper}}<span>Hello {{message}}!</span>{{/helper}}</h1>');
            var frag = stashed({});
            equal(frag.firstChild.firstChild.nodeName.toLowerCase(), 'span', 'got a span');
            equal(innerHTML(frag.firstChild.firstChild), 'Hello World!', 'got back the right text');
        });
        test('attributes sections', function () {
            var template = can.stache('<div {{attributes}}/>');
            var frag = template({ attributes: 'foo=\'bar\'' });
            equal(frag.firstChild.getAttribute('foo'), 'bar', 'set attribute');
            template = can.stache('<div {{#truthy}}foo=\'{{baz}}\'{{/truthy}}/>');
            frag = template({
                truthy: true,
                baz: 'bar'
            });
            equal(frag.firstChild.getAttribute('foo'), 'bar', 'set attribute');
            frag = template({
                truthy: false,
                baz: 'bar'
            });
            equal(frag.firstChild.getAttribute('foo'), null, 'attribute not set if not truthy');
        });
        test('boxes example', function () {
            var boxes = [], Box = can.Map.extend({
                    count: 0,
                    content: 0,
                    top: 0,
                    left: 0,
                    color: 0,
                    tick: function () {
                        var count = this.attr('count') + 1;
                        this.attr({
                            count: count,
                            left: Math.cos(count / 10) * 10,
                            top: Math.sin(count / 10) * 10,
                            color: count % 255,
                            content: count
                        });
                    }
                });
            for (var i = 0; i < 1; i++) {
                boxes.push(new Box({ number: i }));
            }
            var stashed = can.stache('{{#each boxes}}' + '<div class=\'box-view\'>' + '<div class=\'box\' id=\'box-{{number}}\'  style=\'top: {{top}}px; left: {{left}}px; background: rgb(0,0,{{color}});\'>' + '{{content}}' + '</div>' + '</div>' + '{{/each}}');
            var frag = stashed({ boxes: boxes });
            ok(/top: 0px/.test(frag.firstChild.firstChild.getAttribute('style')), '0px');
            boxes[0].tick();
            ok(!/top: 0px/.test(frag.firstChild.firstChild.getAttribute('style')), '!0px');
        });
        var override = {
            comments: {
                'Standalone Without Newline': '!',
                'Standalone Line Endings': '|\n|'
            },
            interpolation: {
                'HTML Escaping': 'These characters should be HTML escaped: & " < >\n',
                'Triple Mustache': 'These characters should not be HTML escaped: & " < >\n',
                'Ampersand': 'These characters should not be HTML escaped: & " < >\n'
            },
            inverted: {
                'Standalone Line Endings': '|\n\n|',
                'Standalone Without Newline': '^\n/'
            },
            partials: {
                'Standalone Line Endings': '|\n>\n|',
                'Standalone Without Newline': '>\n  >\n>',
                'Standalone Without Previous Line': '  >\n>\n>',
                'Standalone Indentation': '\\\n |\n<\n->\n|\n\n/\n'
            },
            sections: {
                'Standalone Line Endings': '|\n\n|',
                'Standalone Without Newline': '#\n/'
            }
        };
        can.each(window.MUSTACHE_SPECS, function (specData) {
            var spec = specData.name;
            can.each(specData.data.tests, function (t) {
                test('specs/' + spec + ' - ' + t.name + ': ' + t.desc, function () {
                    var expected = override[spec] && override[spec][t.name] || t.expected.replace(/&quot;/g, '"');
                    if (spec === 'partials' && t.name === 'Recursion') {
                        t.partials.node = t.partials.node.replace(/</g, '[').replace(/\}>/g, '}]');
                        expected = expected.replace(/</g, '[').replace(/>/g, ']');
                    } else if (spec === 'partials') {
                    }
                    if (t.partials) {
                        for (var name in t.partials) {
                            can.view.registerView(name, t.partials[name]);
                        }
                    }
                    if (t.data.lambda && t.data.lambda.js) {
                        t.data.lambda = eval('(' + t.data.lambda.js + ')');
                    }
                    var res = can.stache(t.template)(t.data);
                    deepEqual(getTextFromFrag(res), expected);
                });
            });
        });
        test('Tokens returning 0 where they should display the number', function () {
            var template = '<div id=\'zero\'>{{completed}}</div>';
            var frag = can.stache(template)({ completed: 0 });
            equal(frag.firstChild.firstChild.nodeValue, '0', 'zero shown');
        });
        test('Inverted section function returning numbers', function () {
            var template = '<div id=\'completed\'>{{^todos.completed}}hidden{{/todos.completed}}</div>';
            var obsvr = new can.Map({ named: false });
            var todos = {
                completed: function () {
                    return obsvr.attr('named');
                }
            };
            var frag = can.stache(template)({ todos: todos });
            deepEqual(frag.firstChild.firstChild.nodeValue, 'hidden', 'hidden shown');
            obsvr.attr('named', true);
            deepEqual(frag.firstChild.firstChild.nodeValue, '', 'hidden gone');
        });
        test('live-binding with escaping', function () {
            var template = '<span id=\'binder1\'>{{ name }}</span><span id=\'binder2\'>{{{name}}}</span>';
            var teacher = new can.Map({ name: '<strong>Mrs Peters</strong>' });
            var tpl = can.stache(template);
            var frag = tpl(teacher);
            deepEqual(innerHTML(frag.firstChild), '&lt;strong&gt;Mrs Peters&lt;/strong&gt;');
            deepEqual(innerHTML(frag.lastChild.firstChild), 'Mrs Peters');
            teacher.attr('name', '<i>Mr Scott</i>');
            deepEqual(innerHTML(frag.firstChild), '&lt;i&gt;Mr Scott&lt;/i&gt;');
            deepEqual(innerHTML(frag.lastChild.firstChild), 'Mr Scott');
        });
        test('truthy', function () {
            var t = {
                template: '{{#name}}Do something, {{name}}!{{/name}}',
                expected: 'Do something, Andy!',
                data: { name: 'Andy' }
            };
            var expected = t.expected.replace(/&quot;/g, '&#34;').replace(/\r\n/g, '\n');
            deepEqual(getText(t.template, t.data), expected);
        });
        test('falsey', function () {
            var t = {
                template: '{{^cannot}}Don\'t do it, {{name}}!{{/cannot}}',
                expected: 'Don\'t do it, Andy!',
                data: { name: 'Andy' }
            };
            var expected = t.expected.replace(/&quot;/g, '&#34;').replace(/\r\n/g, '\n');
            deepEqual(getText(t.template, t.data), expected);
        });
        test('Handlebars helpers', function () {
            can.stache.registerHelper('hello', function (options) {
                return 'Should not hit this';
            });
            can.stache.registerHelper('there', function (options) {
                return 'there';
            });
            can.stache.registerHelper('zero', function (options) {
                return 0;
            });
            can.stache.registerHelper('bark', function (obj, str, number, options) {
                var hash = options.hash || {};
                return 'The ' + obj + ' barked at ' + str + ' ' + number + ' times, ' + 'then the ' + hash.obj + ' ' + hash.action + ' ' + hash.where + ' times' + (hash.loud === true ? ' loudly' : '') + '.';
            });
            var t = {
                template: '{{hello}} {{there}}! {{bark name \'Austin and Andy\' 3 obj=name action=\'growled and snarled\' where=2 loud=true}} Then there were {{zero}} barks :(',
                expected: 'Hello there! The dog barked at Austin and Andy 3 times, then the dog growled and snarled 2 times loudly. Then there were 0 barks :(',
                data: {
                    name: 'dog',
                    hello: 'Hello'
                }
            };
            var expected = t.expected.replace(/&quot;/g, '&#34;').replace(/\r\n/g, '\n');
            deepEqual(getText(t.template, t.data), expected);
        });
        test('Handlebars advanced helpers (from docs)', function () {
            can.stache.registerSimpleHelper('exercise', function (group, action, num, options) {
                if (group && group.length > 0 && action && num > 0) {
                    return options.fn({
                        group: group,
                        action: action,
                        where: options.hash.where,
                        when: options.hash.when,
                        num: num
                    });
                } else {
                    return options.inverse(this);
                }
            });
            var t = {
                template: '{{#exercise pets \'walked\' 3 where=\'around the block\' when=time}}' + 'Along with the {{#group}}{{.}}, {{/group}}' + 'we {{action}} {{where}} {{num}} times {{when}}.' + '{{else}}' + 'We were lazy today.' + '{{/exercise}}',
                expected: 'Along with the cat, dog, parrot, we walked around the block 3 times this morning.',
                expected2: 'We were lazy today.',
                data: {
                    pets: [
                        'cat',
                        'dog',
                        'parrot'
                    ],
                    time: 'this morning'
                }
            };
            var template = can.stache(t.template);
            var frag = template(t.data);
            var div = doc.createElement('div');
            div.appendChild(frag);
            equal(innerHTML(div), t.expected);
            equal(getText(t.template, {}), t.expected2);
        });
        test('Passing functions as data, then executing them', function () {
            var t = {
                template: '{{#nested}}{{welcome name}}{{/nested}}',
                expected: 'Welcome Andy!',
                data: {
                    name: 'Andy',
                    nested: {
                        welcome: function (name) {
                            return 'Welcome ' + name + '!';
                        }
                    }
                }
            };
            var expected = t.expected.replace(/&quot;/g, '&#34;').replace(/\r\n/g, '\n');
            deepEqual(getText(t.template, t.data), expected);
        });
        if (doc === window.document) {
            test('Absolute partials', function () {
                var test_template = can.test.path('view/stache/test/test_template.stache');
                var t = {
                    template1: '{{> ' + test_template + '}}',
                    template2: '{{> ' + test_template + '}}',
                    expected: 'Partials Rock'
                };
                deepEqual(getText(t.template1, {}), t.expected);
                deepEqual(getText(t.template2, {}), t.expected);
            });
        }
        test('No arguments passed to helper', function () {
            var template = can.stache('{{noargHelper}}');
            can.stache.registerHelper('noargHelper', function () {
                return 'foo';
            });
            var div1 = doc.createElement('div');
            var div2 = doc.createElement('div');
            div1.appendChild(template({}));
            div2.appendChild(template(new can.Map()));
            deepEqual(innerHTML(div1), 'foo');
            deepEqual(innerHTML(div2), 'foo');
        });
        test('String literals passed to helper should work (#1143)', 1, function () {
            can.stache.registerHelper('concatStrings', function (arg1, arg2) {
                return arg1 + arg2;
            });
            can.stache('testStringArgs', '{{concatStrings "==" "word"}}');
            var div = doc.createElement('div');
            div.appendChild(can.view('testStringArgs', {}));
            equal(innerHTML(div), '==word');
        });
        test('No arguments passed to helper with list', function () {
            var template = can.stache('{{#items}}{{noargHelper}}{{/items}}');
            var div = doc.createElement('div');
            div.appendChild(template({ items: new can.List([{ name: 'Brian' }]) }, {
                noargHelper: function () {
                    return 'foo';
                }
            }));
            deepEqual(innerHTML(div), 'foo');
        });
        if (isNormalDOM) {
            test('Partials and observes', function () {
                var template;
                var div = doc.createElement('div');
                template = can.stache('<table><thead><tr>{{#data}}{{>' + can.test.path('view/stache/test/partial.stache') + '}}{{/data}}</tr></thead></table>');
                var dom = template({
                    data: new can.Map({
                        list: [
                            'hi',
                            'there'
                        ]
                    })
                });
                div.appendChild(dom);
                var ths = div.getElementsByTagName('th');
                equal(ths.length, 2, 'Got two table headings');
                equal(innerHTML(ths[0]), 'hi', 'First column heading correct');
                equal(innerHTML(ths[1]), 'there', 'Second column heading correct');
            });
        }
        test('Deeply nested partials', function () {
            var t = {
                template: '{{#nest1}}{{#nest2}}{{>partial}}{{/nest2}}{{/nest1}}',
                expected: 'Hello!',
                partials: { partial: '{{#nest3}}{{name}}{{/nest3}}' },
                data: { nest1: { nest2: { nest3: { name: 'Hello!' } } } }
            };
            for (var name in t.partials) {
                can.view.registerView(name, t.partials[name]);
            }
            deepEqual(getText(t.template, t.data), t.expected);
        });
        test('Partials correctly set context', function () {
            var t = {
                template: '{{#users}}{{>partial}}{{/users}}',
                expected: 'foo - bar',
                partials: { partial: '{{ name }} - {{ company }}' },
                data: {
                    users: [{ name: 'foo' }],
                    company: 'bar'
                }
            };
            for (var name in t.partials) {
                can.view.registerView(name, t.partials[name]);
            }
            deepEqual(getText(t.template, t.data), t.expected);
        });
        test('Handlebars helper: if/else', function () {
            var expected;
            var t = {
                template: '{{#if name}}{{name}}{{/if}}{{#if missing}} is missing!{{/if}}',
                expected: 'Andy',
                data: {
                    name: 'Andy',
                    missing: undefined
                }
            };
            expected = t.expected.replace(/&quot;/g, '&#34;').replace(/\r\n/g, '\n');
            deepEqual(getText(t.template, t.data), expected);
            t.data.missing = null;
            expected = t.expected.replace(/&quot;/g, '&#34;').replace(/\r\n/g, '\n');
            deepEqual(getText(t.template, t.data), expected);
        });
        test('Handlebars helper: is/else (with \'eq\' alias)', function () {
            var expected;
            var t = {
                template: '{{#eq ducks tenDucks "10"}}10 ducks{{else}}Not 10 ducks{{/eq}}',
                expected: '10 ducks',
                data: {
                    ducks: '10',
                    tenDucks: function () {
                        return '10';
                    }
                },
                liveData: new can.Map({
                    ducks: '10',
                    tenDucks: function () {
                        return '10';
                    }
                })
            };
            expected = t.expected.replace(/&quot;/g, '&#34;').replace(/\r\n/g, '\n');
            deepEqual(getText(t.template, t.data), expected);
            deepEqual(getText(t.template, t.liveData), expected);
            t.data.ducks = 5;
            deepEqual(getText(t.template, t.data), 'Not 10 ducks');
        });
        test('Handlebars helper: unless', function () {
            var t = {
                template: '{{#unless missing}}Andy is missing!{{/unless}}' + '{{#unless isCool}} But he wasn\'t cool anyways.{{/unless}}',
                expected: 'Andy is missing! But he wasn\'t cool anyways.',
                data: { name: 'Andy' },
                liveData: new can.Map({
                    name: 'Andy',
                    isCool: can.compute(function () {
                        return t.liveData.attr('missing');
                    })
                })
            };
            var expected = t.expected.replace(/&quot;/g, '&#34;').replace(/\r\n/g, '\n');
            deepEqual(getText(t.template, t.data), expected);
            var div = doc.createElement('div');
            div.appendChild(can.stache(t.template)(t.liveData));
            deepEqual(innerHTML(div), expected, '#unless condition false');
            t.liveData.attr('missing', true);
            deepEqual(innerHTML(div), '', '#unless condition true');
        });
        test('Handlebars helper: each', function () {
            var t = {
                template: '{{#each names}}{{this}} {{/each}}',
                expected: 'Andy Austin Justin ',
                data: {
                    names: [
                        'Andy',
                        'Austin',
                        'Justin'
                    ]
                },
                data2: {
                    names: new can.List([
                        'Andy',
                        'Austin',
                        'Justin'
                    ])
                }
            };
            var expected = t.expected.replace(/&quot;/g, '&#34;').replace(/\r\n/g, '\n');
            deepEqual(getText(t.template, t.data), expected);
            var div = doc.createElement('div');
            div.appendChild(can.stache(t.template)(t.data2));
            deepEqual(innerHTML(div), expected, 'Using Observe.List');
            t.data2.names.push('What');
        });
        test('Handlebars helper: with', function () {
            var t = {
                template: '{{#with person}}{{name}}{{/with}}',
                expected: 'Andy',
                data: { person: { name: 'Andy' } }
            };
            var expected = t.expected.replace(/&quot;/g, '&#34;').replace(/\r\n/g, '\n');
            deepEqual(getText(t.template, t.data), expected);
        });
        test('render with double angle', function () {
            var text = '{{& replace_me }}{{{ replace_me_too }}}' + '<ul>{{#animals}}' + '<li>{{.}}</li>' + '{{/animals}}</ul>';
            var compiled = getText(text, { animals: this.animals });
            equal(compiled, '<ul><li>sloth</li><li>bear</li><li>monkey</li></ul>', 'works');
        });
        test('comments', function () {
            var text = '{{! replace_me }}' + '<ul>{{#animals}}' + '<li>{{.}}</li>' + '{{/animals}}</ul>';
            var compiled = getText(text, { animals: this.animals });
            equal(compiled, '<ul><li>sloth</li><li>bear</li><li>monkey</li></ul>');
        });
        test('multi line', function () {
            var text = 'a \n b \n c';
            equal(getTextFromFrag(can.stache(text)({})), text);
        });
        test('multi line elements', function () {
            var text = '<div\n class="{{myClass}}" />', result = can.stache(text)({ myClass: 'a' });
            equal(result.firstChild.className, 'a', 'class name is right');
        });
        test('escapedContent', function () {
            var text = '<span>{{ tags }}</span><label>&amp;</label><strong>{{ number }}</strong><input value=\'{{ quotes }}\'/>';
            var div = doc.createElement('div');
            div.appendChild(can.stache(text)({
                tags: 'foo < bar < car > zar > poo',
                quotes: 'I use \'quote\' fingers & &amp;ersands "a lot"',
                number: 123
            }));
            equal(div.getElementsByTagName('span')[0].firstChild.nodeValue, 'foo < bar < car > zar > poo');
            equal(div.getElementsByTagName('strong')[0].firstChild.nodeValue, 123);
            equal(div.getElementsByTagName('input')[0].value, 'I use \'quote\' fingers & &amp;ersands "a lot"', 'attributes are always safe, and strings are kept as-is without additional escaping');
            equal(innerHTML(div.getElementsByTagName('label')[0]), '&amp;', 'text-based html entities work fine');
        });
        test('unescapedContent', function () {
            var text = '<span>{{{ tags }}}</span><div>{{{ tags }}}</div><input value=\'{{{ quotes }}}\'/>';
            var div = doc.createElement('div');
            div.appendChild(can.stache(text)({
                tags: '<strong>foo</strong><strong>bar</strong>',
                quotes: 'I use \'quote\' fingers "a lot"'
            }));
            equal(div.getElementsByTagName('span')[0].firstChild.nodeType, 1, '');
            equal(innerHTML(div.getElementsByTagName('div')[0]).toLowerCase(), '<strong>foo</strong><strong>bar</strong>');
            equal(innerHTML(div.getElementsByTagName('span')[0]).toLowerCase(), '<strong>foo</strong><strong>bar</strong>');
            equal(div.getElementsByTagName('input')[0].value, 'I use \'quote\' fingers "a lot"', 'escaped no matter what');
        });
        test('attribute single unescaped, html single unescaped', function () {
            var text = '<div id=\'me\' class=\'{{#task.completed}}complete{{/task.completed}}\'>{{ task.name }}</div>';
            var task = new can.Map({ name: 'dishes' });
            var div = doc.createElement('div');
            div.appendChild(can.stache(text)({ task: task }));
            equal(innerHTML(div.getElementsByTagName('div')[0]), 'dishes', 'html correctly dishes');
            equal(div.getElementsByTagName('div')[0].className, '', 'class empty');
            task.attr('name', 'lawn');
            equal(innerHTML(div.getElementsByTagName('div')[0]), 'lawn', 'html correctly lawn');
            equal(div.getElementsByTagName('div')[0].className, '', 'class empty');
            task.attr('completed', true);
            equal(div.getElementsByTagName('div')[0].className, 'complete', 'class changed to complete');
        });
        test('select live binding', function () {
            var text = '<select>{{ #todos }}<option>{{ name }}</option>{{ /todos }}</select>';
            var todos, div;
            todos = new can.List([{
                    id: 1,
                    name: 'Dishes'
                }]);
            div = doc.createElement('div');
            div.appendChild(can.stache(text)({ todos: todos }));
            equal(div.getElementsByTagName('option').length, 1, '1 item in list');
            todos.push({
                id: 2,
                name: 'Laundry'
            });
            equal(div.getElementsByTagName('option').length, 2, '2 items in list');
            todos.splice(0, 2);
            equal(div.getElementsByTagName('option').length, 0, '0 items in list');
        });
        test('multiple hookups in a single attribute', function () {
            var text = '<div class=\'{{ obs.foo }}' + '{{ obs.bar }}{{ obs.baz }}{{ obs.nest.what }}\'></div>';
            var obs = new can.Map({
                foo: 'a',
                bar: 'b',
                baz: 'c',
                nest: new can.Map({ what: 'd' })
            });
            var div = doc.createElement('div');
            div.appendChild(can.stache(text)({ obs: obs }));
            var innerDiv = div.firstChild;
            equal(getAttr(innerDiv, 'class'), 'abcd', 'initial render');
            obs.attr('bar', 'e');
            equal(getAttr(innerDiv, 'class'), 'aecd', 'initial render');
            obs.attr('bar', 'f');
            equal(getAttr(innerDiv, 'class'), 'afcd', 'initial render');
            obs.nest.attr('what', 'g');
            equal(getAttr(innerDiv, 'class'), 'afcg', 'nested observe');
        });
        test('adding and removing multiple html content within a single element', function () {
            var text, obs;
            text = '<div>{{ obs.a }}{{ obs.b }}{{ obs.c }}</div>';
            obs = new can.Map({
                a: 'a',
                b: 'b',
                c: 'c'
            });
            var div = doc.createElement('div');
            div.appendChild(can.stache(text)({ obs: obs }));
            equal(innerHTML(div.firstChild), 'abc', 'initial render');
            obs.attr({
                a: '',
                b: '',
                c: ''
            });
            equal(innerHTML(div.firstChild), '', 'updated values');
            obs.attr({ c: 'c' });
            equal(innerHTML(div.firstChild), 'c', 'updated values');
        });
        test('live binding and removeAttr', function () {
            var text = '{{ #obs.show }}' + '<p {{ obs.attributes }} class="{{ obs.className }}"><span>{{ obs.message }}</span></p>' + '{{ /obs.show }}', obs = new can.Map({
                    show: true,
                    className: 'myMessage',
                    attributes: 'some="myText"',
                    message: 'Live long and prosper'
                }), div = doc.createElement('div');
            div.appendChild(can.stache(text)({ obs: obs }));
            var p = div.getElementsByTagName('p')[0], span = p.getElementsByTagName('span')[0];
            equal(p.getAttribute('some'), 'myText', 'initial render attr');
            equal(getAttr(p, 'class'), 'myMessage', 'initial render class');
            equal(innerHTML(span), 'Live long and prosper', 'initial render innerHTML');
            obs.removeAttr('className');
            equal(getAttr(p, 'class'), '', 'class is undefined');
            obs.attr('className', 'newClass');
            equal(getAttr(p, 'class'), 'newClass', 'class updated');
            obs.removeAttr('attributes');
            equal(p.getAttribute('some'), null, 'attribute is undefined');
            obs.attr('attributes', 'some="newText"');
            equal(p.getAttribute('some'), 'newText', 'attribute updated');
            obs.removeAttr('message');
            equal(innerHTML(span), '', 'text node value is empty');
            obs.attr('message', 'Warp drive, Mr. Sulu');
            equal(innerHTML(span), 'Warp drive, Mr. Sulu', 'text node updated');
            obs.removeAttr('show');
            equal(innerHTML(div), '', 'value in block statement is undefined');
            obs.attr('show', true);
            p = div.getElementsByTagName('p')[0];
            span = p.getElementsByTagName('span')[0];
            equal(p.getAttribute('some'), 'newText', 'value in block statement updated attr');
            equal(getAttr(p, 'class'), 'newClass', 'value in block statement updated class');
            equal(innerHTML(span), 'Warp drive, Mr. Sulu', 'value in block statement updated innerHTML');
        });
        test('hookup within a tag', function () {
            var text = '<div {{ obs.foo }} ' + '{{ obs.baz }}>lorem ipsum</div>', obs = new can.Map({
                    foo: 'class="a"',
                    baz: 'some=\'property\''
                }), compiled = can.stache(text)({ obs: obs });
            var div = doc.createElement('div');
            div.appendChild(compiled);
            var anchor = div.getElementsByTagName('div')[0];
            equal(getAttr(anchor, 'class'), 'a');
            equal(anchor.getAttribute('some'), 'property');
            obs.attr('foo', 'class="b"');
            equal(getAttr(anchor, 'class'), 'b');
            equal(anchor.getAttribute('some'), 'property');
            obs.attr('baz', 'some=\'new property\'');
            equal(getAttr(anchor, 'class'), 'b');
            equal(anchor.getAttribute('some'), 'new property');
            obs.attr('foo', 'class=""');
            obs.attr('baz', '');
            equal(getAttr(anchor, 'class'), '', 'anchor class blank');
            equal(anchor.getAttribute('some'), undefined, 'attribute "some" is undefined');
        });
        test('single escaped tag, removeAttr', function () {
            var text = '<div {{ obs.foo }}>lorem ipsum</div>', obs = new can.Map({ foo: 'data-bar="john doe\'s bar"' }), compiled = can.stache(text)({ obs: obs });
            var div = doc.createElement('div');
            div.appendChild(compiled);
            var anchor = div.getElementsByTagName('div')[0];
            equal(anchor.getAttribute('data-bar'), 'john doe\'s bar');
            obs.removeAttr('foo');
            equal(anchor.getAttribute('data-bar'), null);
            obs.attr('foo', 'data-bar="baz"');
            equal(anchor.getAttribute('data-bar'), 'baz');
        });
        test('html comments', function () {
            var text = '<!-- bind to changes in the todo list --> <div>{{obs.foo}}</div>';
            var obs = new can.Map({ foo: 'foo' });
            var compiled = can.stache(text)({ obs: obs });
            var div = doc.createElement('div');
            div.appendChild(compiled);
            equal(innerHTML(div.getElementsByTagName('div')[0]), 'foo', 'Element as expected');
        });
        test('hookup and live binding', function () {
            var text = '<div class=\'{{ task.completed }}\' {{ data \'task\' task }}>' + '{{ task.name }}' + '</div>', task = new can.Map({
                    completed: false,
                    className: 'someTask',
                    name: 'My Name'
                }), compiled = can.stache(text)({ task: task }), div = doc.createElement('div');
            div.appendChild(compiled);
            var child = div.getElementsByTagName('div')[0];
            ok(child.className.indexOf('false') > -1, 'is incomplete');
            ok(!!can.data(can.$(child), 'task'), 'has data');
            equal(innerHTML(child), 'My Name', 'has name');
            task.attr({
                completed: true,
                name: 'New Name'
            });
            ok(child.className.indexOf('true') !== -1, 'is complete');
            equal(innerHTML(child), 'New Name', 'has new name');
        });
        test('multiple curly braces in a block', function () {
            var text = '{{^obs.items}}' + '<li>No items</li>' + '{{/obs.items}}' + '{{#obs.items}}' + '<li>{{name}}</li>' + '{{/obs.items}}', obs = new can.Map({ items: [] }), compiled = can.stache(text)({ obs: obs });
            var ul = doc.createElement('ul');
            ul.appendChild(compiled);
            equal(innerHTML(ul.getElementsByTagName('li')[0]), 'No items', 'initial observable state');
            obs.attr('items', [{ name: 'foo' }]);
            equal(innerHTML(ul.getElementsByTagName('li')[0]), 'foo', 'updated observable');
        });
        test('unescape bindings change', function () {
            var l = new can.List([
                { complete: true },
                { complete: false },
                { complete: true }
            ]);
            var completed = function () {
                l.attr('length');
                var num = 0;
                l.each(function (item) {
                    if (item.attr('complete')) {
                        num++;
                    }
                });
                return num;
            };
            var text = '<div>{{ completed }}</div>', compiled = can.stache(text)({ completed: completed });
            var div = doc.createElement('div');
            div.appendChild(compiled);
            var child = div.getElementsByTagName('div')[0];
            equal(innerHTML(child), '2', 'at first there are 2 true bindings');
            var item = new can.Map({
                complete: true,
                id: 'THIS ONE'
            });
            l.push(item);
            equal(innerHTML(child), '3', 'now there are 3 complete');
            item.attr('complete', false);
            equal(innerHTML(child), '2', 'now there are 2 complete');
            l.pop();
            item.attr('complete', true);
            equal(innerHTML(child), '2', 'there are still 2 complete');
        });
        test('escape bindings change', function () {
            var l = new can.List([
                { complete: true },
                { complete: false },
                { complete: true }
            ]);
            var completed = function () {
                l.attr('length');
                var num = 0;
                l.each(function (item) {
                    if (item.attr('complete')) {
                        num++;
                    }
                });
                return num;
            };
            var text = '<div>{{{ completed }}}</div>', compiled = can.stache(text)({ completed: completed });
            var div = doc.createElement('div');
            div.appendChild(compiled);
            var child = div.getElementsByTagName('div')[0];
            equal(innerHTML(child), '2', 'at first there are 2 true bindings');
            var item = new can.Map({ complete: true });
            l.push(item);
            equal(innerHTML(child), '3', 'now there are 3 complete');
            item.attr('complete', false);
            equal(innerHTML(child), '2', 'now there are 2 complete');
        });
        test('tag bindings change', function () {
            var l = new can.List([
                { complete: true },
                { complete: false },
                { complete: true }
            ]);
            var completed = function () {
                l.attr('length');
                var num = 0;
                l.each(function (item) {
                    if (item.attr('complete')) {
                        num++;
                    }
                });
                return 'items=\'' + num + '\'';
            };
            var text = '<div {{{ completed }}}></div>', compiled = can.stache(text)({ completed: completed });
            var div = doc.createElement('div');
            div.appendChild(compiled);
            var child = div.getElementsByTagName('div')[0];
            equal(child.getAttribute('items'), '2', 'at first there are 2 true bindings');
            var item = new can.Map({ complete: true });
            l.push(item);
            equal(child.getAttribute('items'), '3', 'now there are 3 complete');
            item.attr('complete', false);
            equal(child.getAttribute('items'), '2', 'now there are 2 complete');
        });
        test('attribute value bindings change', function () {
            var l = new can.List([
                { complete: true },
                { complete: false },
                { complete: true }
            ]);
            var completed = function () {
                l.attr('length');
                var num = 0;
                l.each(function (item) {
                    if (item.attr('complete')) {
                        num++;
                    }
                });
                return num;
            };
            var text = '<div items="{{{ completed }}}"></div>', compiled = can.stache(text)({ completed: completed });
            var div = doc.createElement('div');
            div.appendChild(compiled);
            var child = div.getElementsByTagName('div')[0];
            equal(child.getAttribute('items'), '2', 'at first there are 2 true bindings');
            var item = new can.Map({ complete: true });
            l.push(item);
            equal(child.getAttribute('items'), '3', 'now there are 3 complete');
            item.attr('complete', false);
            equal(child.getAttribute('items'), '2', 'now there are 2 complete');
        });
        test('in tag toggling', function () {
            var text = '<div {{ obs.val }}></div>';
            var obs = new can.Map({ val: 'foo="bar"' });
            var compiled = can.stache(text)({ obs: obs });
            var div = doc.createElement('div');
            div.appendChild(compiled);
            obs.attr('val', 'bar=\'foo\'');
            obs.attr('val', 'foo="bar"');
            var d2 = div.getElementsByTagName('div')[0];
            equal(d2.getAttribute('foo'), 'bar', 'bar set');
            equal(d2.getAttribute('bar'), null, 'bar set');
        });
        test('nested properties', function () {
            var text = '<div>{{ obs.name.first }}</div>';
            var obs = new can.Map({ name: { first: 'Justin' } });
            var compiled = can.stache(text)({ obs: obs });
            var div = doc.createElement('div');
            div.appendChild(compiled);
            div = div.getElementsByTagName('div')[0];
            equal(innerHTML(div), 'Justin');
            obs.attr('name.first', 'Brian');
            equal(innerHTML(div), 'Brian');
        });
        test('tags without chidren or ending with /> do not change the state', function () {
            var text = '<table><tr><td/>{{{ obs.content }}}</tr></div>';
            var obs = new can.Map({ content: '<td>Justin</td>' });
            var compiled = can.stache(text)({ obs: obs });
            var div = doc.createElement('div');
            var html = compiled;
            div.appendChild(html);
            equal(div.getElementsByTagName('span').length, 0, 'there are no spans');
            equal(div.getElementsByTagName('td').length, 2, 'there are 2 td');
        });
        test('nested live bindings', function () {
            expect(0);
            var items = new can.List([{
                    title: 0,
                    is_done: false,
                    id: 0
                }]);
            var div = doc.createElement('div');
            var template = can.stache('<form>{{#items}}{{^is_done}}<div id="{{title}}"></div>{{/is_done}}{{/items}}</form>');
            div.appendChild(template({ items: items }));
            items.push({
                title: 1,
                is_done: false,
                id: 1
            });
            items[0].attr('is_done', true);
        });
        test('list nested in observe live bindings', function () {
            var template = can.stache('<ul>{{#data.items}}<li>{{name}}</li>{{/data.items}}</ul>');
            var data = new can.Map({
                items: [
                    { name: 'Brian' },
                    { name: 'Fara' }
                ]
            });
            var div = doc.createElement('div');
            div.appendChild(template({ data: data }));
            data.items.push(new can.Map({ name: 'Scott' }));
            ok(/Brian/.test(innerHTML(div)), 'added first name');
            ok(/Fara/.test(innerHTML(div)), 'added 2nd name');
            ok(/Scott/.test(innerHTML(div)), 'added name after push');
        });
        test('trailing text', function () {
            var template = can.stache('There are {{ length }} todos');
            var div = doc.createElement('div');
            div.appendChild(template(new can.List([
                {},
                {}
            ])));
            ok(/There are 2 todos/.test(innerHTML(div)), 'got all text');
        });
        if (isNormalDOM) {
            test('recursive views', function () {
                var data = new can.List([{
                        label: 'branch1',
                        children: [{
                                id: 2,
                                label: 'branch2'
                            }]
                    }]);
                var div = doc.createElement('div');
                div.appendChild(can.view(can.test.path('view/stache/test/recursive.stache'), { items: data }));
                ok(/class="?leaf"?/.test(innerHTML(div)), 'we have a leaf');
            });
        }
        test('live binding textarea', function () {
            var template = can.stache('<textarea>Before{{ obs.middle }}After</textarea>');
            var obs = new can.Map({ middle: 'yes' }), div = doc.createElement('div');
            div.appendChild(template({ obs: obs }));
            var textarea = div.firstChild;
            equal(getValue(textarea), 'BeforeyesAfter');
            obs.attr('middle', 'Middle');
            equal(getValue(textarea), 'BeforeMiddleAfter');
        });
        test('reading a property from a parent object when the current context is an observe', function () {
            var template = can.stache('{{#foos}}<span>{{bar}}</span>{{/foos}}');
            var data = {
                foos: new can.List([
                    { name: 'hi' },
                    { name: 'bye' }
                ]),
                bar: 'Hello World'
            };
            var div = doc.createElement('div');
            var res = template(data);
            div.appendChild(res);
            var spans = div.getElementsByTagName('span');
            equal(spans.length, 2, 'Got two <span> elements');
            equal(innerHTML(spans[0]), 'Hello World', 'First span Hello World');
            equal(innerHTML(spans[1]), 'Hello World', 'Second span Hello World');
        });
        test('helper parameters don\'t convert functions', function () {
            can.stache.registerHelper('helperWithFn', function (fn) {
                ok(can.isFunction(fn), 'Parameter is a function');
                equal(fn(), 'Hit me!', 'Got the expected function');
            });
            var renderer = can.stache('{{helperWithFn test}}');
            renderer({
                test: function () {
                    return 'Hit me!';
                }
            });
        });
        test('computes as helper parameters don\'t get converted', function () {
            can.stache.registerHelper('computeTest', function (no) {
                equal(no(), 5, 'Got computed calue');
                ok(no.isComputed, 'no is still a compute');
            });
            var renderer = can.stache('{{computeTest test}}');
            renderer({ test: can.compute(5) });
        });
        test('computes are supported in default helpers', function () {
            var staches = {
                'if': '{{#if test}}if{{else}}else{{/if}}',
                'not_if': 'not_{{^if test}}not{{/if}}if',
                'each': '{{#each test}}{{.}}{{/each}}',
                'with': 'wit{{#with test}}<span>{{3}}</span>{{/with}}'
            };
            var template = can.stache('There are {{ length }} todos');
            var div = doc.createElement('div');
            div.appendChild(template(new can.List([
                {},
                {}
            ])));
            ok(/There are 2 todos/.test(innerHTML(div)), 'got all text');
            var renderer, result, data, actual, span;
            for (result in staches) {
                renderer = can.stache(staches[result]);
                data = [
                    'e',
                    'a',
                    'c',
                    'h'
                ];
                div = doc.createElement('div');
                actual = renderer({ test: can.compute(data) });
                div.appendChild(actual);
                span = div.getElementsByTagName('span')[0];
                if (span && span.firstChild) {
                    div.insertBefore(span.firstChild, span);
                    div.removeChild(span);
                }
                actual = innerHTML(div);
                equal(actual, result, 'can.compute resolved for helper ' + result);
            }
            var inv_staches = {
                'else': '{{#if test}}if{{else}}else{{/if}}',
                'not_not_if': 'not_{{^if test}}not_{{/if}}if',
                'not_each': 'not_{{#each test}}_{{/each}}each',
                'not_with': 'not{{#with test}}_{{/with}}_with'
            };
            for (result in inv_staches) {
                renderer = can.stache(inv_staches[result]);
                data = null;
                div = doc.createElement('div');
                actual = renderer({ test: can.compute(data) });
                div.appendChild(actual);
                actual = innerHTML(div);
                equal(actual, result, 'can.compute resolved for helper ' + result);
            }
        });
        test('multiple tbodies in table hookup', function () {
            var text = '<table>' + '{{#people}}' + '<tbody><tr><td>{{name}}</td></tr></tbody>' + '{{/people}}' + '</table>', people = new can.List([
                    { name: 'Steve' },
                    { name: 'Doug' }
                ]), compiled = can.stache(text)({ people: people });
            equal(compiled.firstChild.getElementsByTagName('tbody').length, 2, 'two tbodies');
        });
        test('Observe with array attributes', function () {
            var renderer = can.stache('<ul>{{#todos}}<li>{{.}}</li>{{/todos}}</ul><div>{{message}}</div>');
            var div = doc.createElement('div');
            var data = new can.Map({
                todos: [
                    'Line #1',
                    'Line #2',
                    'Line #3'
                ],
                message: 'Hello',
                count: 2
            });
            div.appendChild(renderer(data));
            equal(innerHTML(div.getElementsByTagName('li')[1]), 'Line #2', 'Check initial array');
            equal(innerHTML(div.getElementsByTagName('div')[0]), 'Hello', 'Check initial message');
            data.attr('todos.1', 'Line #2 changed');
            data.attr('message', 'Hello again');
            equal(innerHTML(div.getElementsByTagName('li')[1]), 'Line #2 changed', 'Check updated array');
            equal(innerHTML(div.getElementsByTagName('div')[0]), 'Hello again', 'Check updated message');
        });
        test('Observe list returned from the function', function () {
            var renderer = can.stache('<ul>{{#todos}}<li>{{.}}</li>{{/todos}}</ul>');
            var div = doc.createElement('div');
            var todos = new can.List();
            var data = {
                todos: function () {
                    return todos;
                }
            };
            div.appendChild(renderer(data));
            todos.push('Todo #1');
            equal(div.getElementsByTagName('li').length, 1, 'Todo is successfuly created');
            equal(innerHTML(div.getElementsByTagName('li')[0]), 'Todo #1', 'Pushing to the list works');
        });
        test('Contexts within helpers not always resolved correctly', function () {
            can.stache.registerHelper('bad_context', function (context, options) {
                return [
                    '<span>' + this.text + '</span> should not be ',
                    options.fn(context)
                ];
            });
            var renderer = can.stache('{{#bad_context next_level}}<span>{{text}}</span><br/><span>{{other_text}}</span>{{/bad_context}}'), data = {
                    next_level: {
                        text: 'bar',
                        other_text: 'In the inner context'
                    },
                    text: 'foo'
                }, div = doc.createElement('div');
            div.appendChild(renderer(data));
            equal(innerHTML(div.getElementsByTagName('span')[0]), 'foo', 'Incorrect context passed to helper');
            equal(innerHTML(div.getElementsByTagName('span')[1]), 'bar', 'Incorrect text in helper inner template');
            equal(innerHTML(div.getElementsByTagName('span')[2]), 'In the inner context', 'Incorrect other_text in helper inner template');
        });
        test('Contexts are not always passed to partials properly', function () {
            can.view.registerView('inner', '{{#if other_first_level}}{{other_first_level}}{{else}}{{second_level}}{{/if}}');
            var renderer = can.stache('{{#first_level}}<span>{{> inner}}</span> should equal <span>{{other_first_level}}</span>{{/first_level}}'), data = {
                    first_level: { second_level: 'bar' },
                    other_first_level: 'foo'
                }, div = doc.createElement('div');
            div.appendChild(renderer(data));
            equal(innerHTML(div.getElementsByTagName('span')[0]), 'foo', 'Incorrect context passed to helper');
            equal(innerHTML(div.getElementsByTagName('span')[1]), 'foo', 'Incorrect text in helper inner template');
        });
        test('Functions and helpers should be passed the same context', function () {
            var textNodes = function (el, cb) {
                var cur = el.firstChild;
                while (cur) {
                    if (cur.nodeType === 3) {
                        cb(cur);
                    } else if (el.nodeType === 1) {
                        textNodes(cur, cb);
                    }
                    cur = cur.nextSibling;
                }
            };
            can.stache.registerHelper('to_upper', function (fn, options) {
                if (!fn.fn) {
                    return typeof fn === 'function' ? fn().toString().toUpperCase() : fn.toString().toUpperCase();
                } else {
                    var frag = fn.fn(this);
                    textNodes(frag, function (el) {
                        el.nodeValue = el.nodeValue.toUpperCase();
                    });
                    return frag;
                }
            });
            var renderer = can.stache(' "<span>{{#to_upper}}{{next_level.text}}{{/to_upper}}</span>"'), data = {
                    next_level: {
                        text: function () {
                            return this.other_text;
                        },
                        other_text: 'In the inner context'
                    }
                }, div = doc.createElement('div');
            window.other_text = 'Window context';
            div.appendChild(renderer(data));
            equal(innerHTML(div.getElementsByTagName('span')[0]), data.next_level.other_text.toUpperCase(), 'correct context passed to helper');
        });
        test('Interpolated values when iterating through an Observe.List should still render when not surrounded by a DOM node', function () {
            var renderer = can.stache('{{ #todos }}{{ name }}{{ /todos }}'), renderer2 = can.stache('{{ #todos }}<span>{{ name }}</span>{{ /todos }}'), todos = [
                    {
                        id: 1,
                        name: 'Dishes'
                    },
                    {
                        id: 2,
                        name: 'Forks'
                    }
                ], liveData = { todos: new can.List(todos) }, plainData = { todos: todos }, div = doc.createElement('div');
            div.appendChild(renderer2(plainData));
            equal(innerHTML(div.getElementsByTagName('span')[0]), 'Dishes', 'Array item rendered with DOM container');
            equal(innerHTML(div.getElementsByTagName('span')[1]), 'Forks', 'Array item rendered with DOM container');
            div.innerHTML = '';
            div.appendChild(renderer2(liveData));
            equal(innerHTML(div.getElementsByTagName('span')[0]), 'Dishes', 'List item rendered with DOM container');
            equal(innerHTML(div.getElementsByTagName('span')[1]), 'Forks', 'List item rendered with DOM container');
            div = doc.createElement('div');
            div.appendChild(renderer(plainData));
            equal(innerHTML(div), 'DishesForks', 'Array item rendered without DOM container');
            div = doc.createElement('div');
            div.appendChild(renderer(liveData));
            equal(innerHTML(div), 'DishesForks', 'List item rendered without DOM container');
            liveData.todos.push({
                id: 3,
                name: 'Knives'
            });
            equal(innerHTML(div), 'DishesForksKnives', 'New list item rendered without DOM container');
        });
        test('objects with a \'key\' or \'index\' property should work in helpers', function () {
            var renderer = can.stache('{{ #obj }}{{ show_name }}{{ /obj }}'), div = doc.createElement('div');
            div.appendChild(renderer({
                obj: {
                    id: 2,
                    name: 'Forks',
                    key: 'bar'
                }
            }, {
                show_name: function () {
                    return this.name;
                }
            }));
            equal(innerHTML(div), 'Forks', 'item name rendered');
            div = doc.createElement('div');
            div.appendChild(renderer({
                obj: {
                    id: 2,
                    name: 'Forks',
                    index: 'bar'
                }
            }, {
                show_name: function () {
                    return this.name;
                }
            }));
            equal(innerHTML(div), 'Forks', 'item name rendered');
        });
        test('2 way binding helpers', function () {
            var Value = function (el, value) {
                this.updateElement = function (ev, newVal) {
                    el.value = newVal || '';
                };
                value.bind('change', this.updateElement);
                el.onchange = function () {
                    value(el.value);
                };
                this.teardown = function () {
                    value.unbind('change', this.updateElement);
                    el.onchange = null;
                };
                el.value = value() || '';
            };
            var val;
            can.stache.registerHelper('myValue', function (value) {
                return function (el) {
                    val = new Value(el, value);
                };
            });
            var renderer = can.stache('<input {{myValue user.name}}/>');
            var div = doc.createElement('div'), u = new can.Map({ name: 'Justin' });
            div.appendChild(renderer({ user: u }));
            var input = div.getElementsByTagName('input')[0];
            equal(input.value, 'Justin', 'Name is set correctly');
            u.attr('name', 'Eli');
            equal(input.value, 'Eli', 'Changing observe updates value');
            input.value = 'Austin';
            input.onchange();
            equal(u.attr('name'), 'Austin', 'Name changed by input field');
            val.teardown();
            renderer = can.stache('<input {{myValue user.name}}/>');
            div = doc.createElement('div');
            u = new can.Map({});
            div.appendChild(renderer({ user: u }));
            input = div.getElementsByTagName('input')[0];
            equal(input.value, '', 'Name is set correctly');
            u.attr('name', 'Eli');
            equal(input.value, 'Eli', 'Changing observe updates value');
            input.value = 'Austin';
            input.onchange();
            equal(u.attr('name'), 'Austin', 'Name changed by input field');
            val.teardown();
            renderer = can.stache('<input {{myValue user.name}}/>');
            div = doc.createElement('div');
            u = new can.Map({ name: null });
            div.appendChild(renderer({ user: u }));
            input = div.getElementsByTagName('input')[0];
            equal(input.value, '', 'Name is set correctly with null');
            u.attr('name', 'Eli');
            equal(input.value, 'Eli', 'Changing observe updates value');
            input.value = 'Austin';
            input.onchange();
            equal(u.attr('name'), 'Austin', 'Name changed by input field');
            val.teardown();
        });
        test('can pass in partials', function () {
            var hello = can.view(can.test.path('view/stache/test/hello.stache'));
            var fancyName = can.view(can.test.path('view/stache/test/fancy_name.stache'));
            var result = hello({ name: 'World' }, { partials: { name: fancyName } });
            ok(/World/.test(innerHTML(result.firstChild)), 'Hello World worked');
        });
        test('can pass in helpers', function () {
            var helpers = can.stache('<p>Hello {{cap name}}</p>');
            var result = helpers({ name: 'world' }, {
                helpers: {
                    cap: function (name) {
                        return can.capitalize(name);
                    }
                }
            });
            ok(/World/.test(innerHTML(result.firstChild)), 'Hello World worked');
        });
        test('HTML comment with helper', function () {
            var text = [
                    '<ul>',
                    '{{#todos}}',
                    '<li {{data \'todo\'}}>',
                    '<!-- html comment #1 -->',
                    '{{name}}',
                    '<!-- html comment #2 -->',
                    '</li>',
                    '{{/todos}}',
                    '</ul>'
                ], todos = new can.List([{
                        id: 1,
                        name: 'Dishes'
                    }]), compiled = can.stache(text.join('\n'))({ todos: todos }), div = doc.createElement('div'), li;
            var comments = function (el) {
                var count = 0;
                var cur = el.firstChild;
                while (cur) {
                    if (cur.nodeType === 8) {
                        ++count;
                    }
                    cur = cur.nextSibling;
                }
                return count;
            };
            div.appendChild(compiled);
            li = div.getElementsByTagName('ul')[0].getElementsByTagName('li');
            equal(li.length, 1, '1 item in list');
            equal(comments(li[0]), 2, '2 comments in item #1');
            todos.push({
                id: 2,
                name: 'Laundry'
            });
            li = div.getElementsByTagName('ul')[0].getElementsByTagName('li');
            equal(li.length, 2, '2 items in list');
            equal(comments(li[0]), 2, '2 comments in item #1');
            equal(comments(li[1]), 2, '2 comments in item #2');
            todos.splice(0, 2);
            li = div.getElementsByTagName('ul')[0].getElementsByTagName('li');
            equal(li.length, 0, '0 items in list');
        });
        test('Empty strings in arrays within Observes that are iterated should return blank strings', function () {
            var data = new can.Map({
                    colors: [
                        '',
                        'red',
                        'green',
                        'blue'
                    ]
                }), compiled = can.stache('<select>{{#colors}}<option>{{.}}</option>{{/colors}}</select>')(data), div = doc.createElement('div');
            div.appendChild(compiled);
            equal(innerHTML(div.getElementsByTagName('option')[0]), '', 'Blank string should return blank');
        });
        test('Null properties do not throw errors', function () {
            var renderer = can.stache('Foo bar {{#foo.bar}}exists{{/foo.bar}}{{^foo.bar}}does not exist{{/foo.bar}}'), div = doc.createElement('div'), div2 = doc.createElement('div'), frag, frag2;
            try {
                frag = renderer(new can.Map({ foo: null }));
            } catch (e) {
                ok(false, 'rendering with null threw an error');
            }
            frag2 = renderer(new can.Map({ foo: { bar: 'baz' } }));
            div.appendChild(frag);
            div2.appendChild(frag2);
            equal(innerHTML(div), 'Foo bar does not exist');
            equal(innerHTML(div2), 'Foo bar exists');
        });
        test('Data helper should set proper data instead of a context stack', function () {
            var partials = {
                'nested_data': '<span id="has_data" {{data "attr"}}></span>',
                'nested_data2': '{{#this}}<span id="has_data" {{data "attr"}}></span>{{/this}}',
                'nested_data3': '{{#bar}}<span id="has_data" {{data "attr"}}></span>{{/bar}}'
            };
            for (var name in partials) {
                can.view.registerView(name, partials[name]);
            }
            var renderer = can.stache('{{#bar}}{{> #nested_data}}{{/bar}}'), renderer2 = can.stache('{{#bar}}{{> #nested_data2}}{{/bar}}'), renderer3 = can.stache('{{#bar}}{{> #nested_data3}}{{/bar}}'), div = doc.createElement('div'), data = new can.Map({
                    foo: 'bar',
                    bar: new can.Map({})
                }), span;
            div = doc.createElement('div');
            div.appendChild(renderer(data));
            span = can.$(div.getElementsByTagName('span')[0]);
            strictEqual(can.data(span, 'attr'), data.bar, 'Nested data 1 should have correct data');
            div = doc.createElement('div');
            div.appendChild(renderer2(data));
            span = can.$(div.getElementsByTagName('span')[0]);
            strictEqual(can.data(span, 'attr'), data.bar, 'Nested data 2 should have correct data');
            div = doc.createElement('div');
            div.appendChild(renderer3(data));
            span = can.$(div.getElementsByTagName('span')[0]);
            strictEqual(can.data(span, 'attr'), data.bar, 'Nested data 3 should have correct data');
        });
        test('Functions passed to default helpers should be evaluated', function () {
            var renderer = can.stache('{{#if hasDucks}}Ducks: {{ducks}}{{else}}No ducks!{{/if}}'), div = doc.createElement('div'), data = new can.Map({
                    ducks: '',
                    hasDucks: function () {
                        return this.attr('ducks').length > 0;
                    }
                });
            var span;
            div.appendChild(renderer(data));
            span = can.$(div.getElementsByTagName('span')[0]);
            equal(innerHTML(div), 'No ducks!', 'The function evaluated should evaluate false');
        });
        test('avoid global helpers', function () {
            var noglobals = can.stache('{{sometext person.name}}');
            var div = doc.createElement('div'), div2 = doc.createElement('div');
            var person = new can.Map({ name: 'Brian' });
            var result = noglobals({ person: person }, {
                sometext: function (name) {
                    return 'Mr. ' + name();
                }
            });
            var result2 = noglobals({ person: person }, {
                sometext: function (name) {
                    return name() + ' rules';
                }
            });
            div.appendChild(result);
            div2.appendChild(result2);
            person.attr('name', 'Ajax');
            equal(innerHTML(div), 'Mr. Ajax');
            equal(innerHTML(div2), 'Ajax rules');
        });
        test('Helpers always have priority (#258)', function () {
            can.stache.registerHelper('callMe', function (arg) {
                return arg + ' called me!';
            });
            var t = {
                template: '<div>{{callMe \'Tester\'}}</div>',
                expected: '<div>Tester called me!</div>',
                data: {
                    callMe: function (arg) {
                        return arg + ' hanging up!';
                    }
                }
            };
            var expected = t.expected.replace(/&quot;/g, '&#34;').replace(/\r\n/g, '\n');
            deepEqual(getText(t.template, t.data), expected);
        });
        test('avoid global helpers', function () {
            var noglobals = can.stache('{{sometext person.name}}');
            var div = doc.createElement('div'), div2 = doc.createElement('div');
            var person = new can.Map({ name: 'Brian' });
            var result = noglobals({ person: person }, {
                sometext: function (name) {
                    return 'Mr. ' + name();
                }
            });
            var result2 = noglobals({ person: person }, {
                sometext: function (name) {
                    return name() + ' rules';
                }
            });
            div.appendChild(result);
            div2.appendChild(result2);
            person.attr('name', 'Ajax');
            equal(innerHTML(div), 'Mr. Ajax');
            equal(innerHTML(div2), 'Ajax rules');
        });
        test('Each does not redraw items', function () {
            var animals = new can.List([
                    'sloth',
                    'bear'
                ]), renderer = can.stache('<div>my<b>favorite</b>animals:{{#each animals}}<label>Animal=</label> <span>{{this}}</span>{{/}}!</div>');
            var div = doc.createElement('div');
            var frag = renderer({ animals: animals });
            div.appendChild(frag);
            div.getElementsByTagName('label')[0].myexpando = 'EXPANDO-ED';
            equal(div.getElementsByTagName('label').length, 2, 'There are 2 labels');
            animals.push('turtle');
            equal(div.getElementsByTagName('label')[0].myexpando, 'EXPANDO-ED', 'same expando');
            equal(innerHTML(div.getElementsByTagName('span')[2]), 'turtle', 'turtle added');
        });
        test('Each works with the empty list', function () {
            var animals = new can.List([]), renderer = can.stache('<div>my<b>favorite</b>animals:{{#each animals}}<label>Animal=</label> <span>{{this}}</span>{{/}}!</div>');
            var div = doc.createElement('div');
            var frag = renderer({ animals: animals });
            div.appendChild(frag);
            animals.push('sloth', 'bear');
            equal(div.getElementsByTagName('label').length, 2, 'There are 2 labels');
        });
        test('each works within another branch', function () {
            var animals = new can.List(['sloth']), template = '<div>Animals:' + '{{#if animals.length}}~' + '{{#each animals}}' + '<span>{{.}}</span>' + '{{/each}}' + '{{else}}' + 'No animals' + '{{/if}}' + '!</div>';
            var renderer = can.stache(template);
            var div = doc.createElement('div');
            var frag = renderer({ animals: animals });
            div.appendChild(frag);
            equal(div.getElementsByTagName('span').length, 1, 'There is 1 sloth');
            animals.pop();
            equal(innerHTML(div.getElementsByTagName('div')[0]), 'Animals:No animals!');
        });
        test('a compute gets passed to a plugin', function () {
            can.stache.registerHelper('iamhungryforcomputes', function (value) {
                ok(value.isComputed, 'value is a compute');
                return function (el) {
                };
            });
            var renderer = can.stache('<input {{iamhungryforcomputes userName}}/>');
            var div = doc.createElement('div'), u = new can.Map({ name: 'Justin' });
            div.appendChild(renderer({ userName: u.compute('name') }));
        });
        test('Object references can escape periods for key names containing periods', function () {
            var template = can.stache('{{#foo.bar}}' + '{{some\\.key\\.name}} {{some\\.other\\.key.with\\.more}}' + '{{/foo.bar}}'), data = {
                    foo: {
                        bar: [{
                                'some.key.name': 100,
                                'some.other.key': { 'with.more': 'values' }
                            }]
                    }
                };
            var div = doc.createElement('div');
            div.appendChild(template(data));
            equal(innerHTML(div), '100 values');
        });
        test('Computes should be resolved prior to accessing attributes', function () {
            var template = can.stache('{{list.length}}'), data = { list: can.compute(new can.List()) };
            var div = doc.createElement('div');
            div.appendChild(template(data));
            equal(innerHTML(div), '0');
        });
        test('Helpers can be passed . or this for the active context', function () {
            can.stache.registerHelper('rsvp', function (attendee, event) {
                return attendee.name + ' is attending ' + event.name;
            });
            var template = can.stache('{{#attendee}}{{#events}}<div>{{rsvp attendee .}}</div>{{/events}}{{/#attendee}}'), data = {
                    attendee: { name: 'Justin' },
                    events: [
                        { name: 'Reception' },
                        { name: 'Wedding' }
                    ]
                };
            var div = doc.createElement('div');
            div.appendChild(template(data));
            var children = div.getElementsByTagName('div');
            equal(innerHTML(children[0]), 'Justin is attending Reception');
            equal(innerHTML(children[1]), 'Justin is attending Wedding');
        });
        test('helpers only called once (#477)', function () {
            var callCount = 0;
            can.stache.registerHelper('foo', function (text) {
                callCount++;
                equal(callCount, 1, 'call count is only ever one');
                return 'result';
            });
            var obs = new can.Map({ quux: false });
            var template = can.stache('Foo text is: {{#if quux}}{{foo \'bar\'}}{{/if}}');
            template(obs);
            obs.attr('quux', true);
        });
        test('helpers between tags (#469)', function () {
            can.stache.registerHelper('itemsHelper', function () {
                return function (textNode) {
                    equal(textNode.nodeType, 3, 'right nodeType');
                };
            });
            var template = can.stache('<ul>{{itemsHelper}}</ul>');
            template();
        });
        test('hiding image srcs (#157)', function () {
            var template = can.stache('<img {{#image}}src="{{.}}"{{/image}} alt="An image" />'), data = new can.Map({ image: null }), url = 'http://canjs.us/scripts/static/img/canjs_logo_yellow_small.png';
            var frag = template(data), img = frag.firstChild;
            equal(img.getAttribute('src'), null, 'there is no src');
            data.attr('image', url);
            notEqual(img.getAttribute('src'), null, 'Image should have src');
            equal(img.getAttribute('src'), url, 'images src is correct');
        });
        test('live binding in a truthy section', function () {
            var template = can.stache('<div {{#width}}width="{{.}}"{{/width}}></div>'), data = new can.Map({ width: '100' });
            var frag = template(data), img = frag.firstChild;
            equal(img.getAttribute('width'), '100', 'initial width is correct');
            data.attr('width', '300');
            equal(img.getAttribute('width'), '300', 'updated width is correct');
        });
        test('backtracks in mustache (#163)', function () {
            var template = can.stache('{{#grid.rows}}' + '{{#grid.cols}}' + '<div>{{columnData ../. .}}</div>' + '{{/grid.cols}}' + '{{/grid.rows}}');
            var grid = new can.Map({
                rows: [
                    {
                        first: 'Justin',
                        last: 'Meyer'
                    },
                    {
                        first: 'Brian',
                        last: 'Moschel'
                    }
                ],
                cols: [
                    { prop: 'first' },
                    { prop: 'last' }
                ]
            });
            var frag = template({ grid: grid }, {
                columnData: function (row, col) {
                    return row.attr(col.attr('prop'));
                }
            });
            var divs = getChildNodes(frag);
            equal(divs.length, 4, 'there are 4 divs');
            var vals = can.map(divs, function (div) {
                return innerHTML(div);
            });
            deepEqual(vals, [
                'Justin',
                'Meyer',
                'Brian',
                'Moschel'
            ], 'div values are the same');
        });
        test('support null and undefined as an argument', function () {
            var template = can.stache('{{aHelper null undefined}}');
            template({}, {
                aHelper: function (arg1, arg2) {
                    ok(arg1 === null);
                    ok(arg2 === undefined);
                }
            });
        });
        test('passing can.List to helper (#438)', function () {
            var renderer = can.stache('<ul><li {{helper438 observeList}}>observeList broken</li>' + '<li {{helper438 array}}>plain arrays work</li></ul>');
            can.stache.registerHelper('helper438', function (classnames) {
                return function (el) {
                    empty(el);
                    el.appendChild(el.ownerDocument.createTextNode('Helper called'));
                };
            });
            var frag = renderer({
                observeList: new can.List([
                    { test: 'first' },
                    { test: 'second' }
                ]),
                array: [
                    { test: 'first' },
                    { test: 'second' }
                ]
            });
            var div = doc.createElement('div');
            div.appendChild(frag);
            var ul = div.firstChild;
            equal(innerHTML(ul.childNodes.item(0)), 'Helper called', 'Helper called');
            equal(innerHTML(ul.childNodes.item(1)), 'Helper called', 'Helper called');
        });
        test('hiding image srcs (#494)', function () {
            var template = can.stache('<img src="{{image}}"/>'), data = new can.Map({ image: '' }), url = 'http://canjs.us/scripts/static/img/canjs_logo_yellow_small.png';
            var frag = template(data), img = frag.firstChild;
            equal(img.getAttribute('src'), null, 'there is no src');
            data.attr('image', url);
            notEqual(img.getAttribute('src'), '', 'Image should have src');
            equal(img.getAttribute('src'), url, 'images src is correct');
        });
        test('hiding image srcs with complex content (#494)', function () {
            var template = can.stache('<img src="{{#image}}http://{{domain}}/{{loc}}.png{{/image}}"/>'), data = new can.Map({}), imgData = {
                    domain: 'canjs.us',
                    loc: 'scripts/static/img/canjs_logo_yellow_small'
                }, url = 'http://canjs.us/scripts/static/img/canjs_logo_yellow_small.png';
            var frag = template(data), img = frag.firstChild;
            equal(img.getAttribute('src'), null, 'there is no src');
            data.attr('image', imgData);
            notEqual(img.getAttribute('src'), '', 'Image should have src');
            equal(img.getAttribute('src'), url, 'images src is correct');
        });
        test('empty lists update', 2, function () {
            var template = can.stache('<p>{{#list}}{{.}}{{/list}}</p>');
            var map = new can.Map({ list: ['something'] });
            var frag = template(map);
            var div = doc.createElement('div');
            div.appendChild(frag);
            equal(innerHTML(div.childNodes.item(0)), 'something', 'initial list content set');
            map.attr('list', [
                'one',
                'two'
            ]);
            equal(innerHTML(div.childNodes.item(0)), 'onetwo', 'updated list content set');
        });
        test('attributes in truthy section', function () {
            var template = can.stache('<p {{#attribute}}data-test="{{attribute}}"{{/attribute}}></p>');
            var data1 = { attribute: 'test-value' };
            var frag1 = template(data1);
            var div1 = doc.createElement('div');
            div1.appendChild(frag1);
            equal(div1.childNodes.item(0).getAttribute('data-test'), 'test-value', 'hyphenated attribute value');
            var data2 = { attribute: 'test value' };
            var frag2 = template(data2);
            var div2 = doc.createElement('div');
            div2.appendChild(frag2);
            equal(div2.childNodes.item(0).getAttribute('data-test'), 'test value', 'whitespace in attribute value');
        });
        test('live bound attributes with no \'=\'', function () {
            var template = can.stache('<input type="radio" {{#selected}}checked{{/selected}}>');
            var data = new can.Map({ selected: false });
            var frag = template(data);
            var div = doc.createElement('div');
            div.appendChild(frag);
            data.attr('selected', true);
            equal(div.childNodes.item(0).checked, true, 'hyphenated attribute value');
            data.attr('selected', false);
            equal(div.childNodes.item(0).checked, false, 'hyphenated attribute value');
        });
        test('outputting array of attributes', function () {
            var template = can.stache('<p {{#attribute}}{{name}}="{{value}}"{{/attribute}}></p>');
            var data = {
                attribute: [
                    {
                        'name': 'data-test1',
                        'value': 'value1'
                    },
                    {
                        'name': 'data-test2',
                        'value': 'value2'
                    },
                    {
                        'name': 'data-test3',
                        'value': 'value3'
                    }
                ]
            };
            var frag = template(data);
            var div = doc.createElement('div');
            div.appendChild(frag);
            equal(div.childNodes.item(0).getAttribute('data-test1'), 'value1', 'first value');
            equal(div.childNodes.item(0).getAttribute('data-test2'), 'value2', 'second value');
            equal(div.childNodes.item(0).getAttribute('data-test3'), 'value3', 'third value');
        });
        test('incremental updating of #each within an if', function () {
            var template = can.stache('{{#if items.length}}<ul>{{#each items}}<li/>{{/each}}</ul>{{/if}}');
            var items = new can.List([
                {},
                {}
            ]);
            var div = doc.createElement('div');
            div.appendChild(template({ items: items }));
            var ul = div.getElementsByTagName('ul')[0];
            ul.setAttribute('original', 'yup');
            items.push({});
            ok(ul === div.getElementsByTagName('ul')[0], 'ul is still the same');
        });
        test('stache.safeString', function () {
            var text = 'Google', url = 'http://google.com/', templateEscape = can.stache('{{link "' + text + '" "' + url + '"}}'), templateUnescape = can.stache('{{{link "' + text + '" "' + url + '"}}}');
            can.stache.registerHelper('link', function (text, url) {
                var link = '<a href="' + url + '">' + text + '</a>';
                return can.stache.safeString(link);
            });
            var div = doc.createElement('div');
            var frag = templateEscape({});
            div.appendChild(frag);
            equal(getChildNodes(div).length, 1, 'rendered a DOM node');
            equal(div.childNodes.item(0).nodeName, 'A', 'rendered an anchor tag');
            equal(innerHTML(div.childNodes.item(0)), text, 'rendered the text properly');
            equal(div.childNodes.item(0).getAttribute('href'), url, 'rendered the href properly');
            div = doc.createElement('div');
            div.appendChild(templateUnescape({}));
            equal(getChildNodes(div).length, 1, 'rendered a DOM node');
            equal(div.childNodes.item(0).nodeName, 'A', 'rendered an anchor tag');
            equal(innerHTML(div.childNodes.item(0)), text, 'rendered the text properly');
            equal(div.childNodes.item(0).getAttribute('href'), url, 'rendered the href properly');
        });
        test('changing the list works with each', function () {
            var template = can.stache('<ul>{{#each list}}<li>.</li>{{/each}}</ul>');
            var map = new can.Map({ list: ['foo'] });
            var tpl = template(map).firstChild;
            equal(tpl.getElementsByTagName('li').length, 1, 'one li');
            map.attr('list', new can.List([
                'bar',
                'car'
            ]));
            equal(tpl.getElementsByTagName('li').length, 2, 'two lis');
        });
        test('nested properties binding (#525)', function () {
            var template = can.stache('<label>{{name.first}}</label>');
            var me = new can.Map();
            var label = template(me).firstChild;
            me.attr('name', { first: 'Justin' });
            equal(innerHTML(label), 'Justin', 'set name object');
            me.attr('name', { first: 'Brian' });
            equal(innerHTML(label), 'Brian', 'merged name object');
            me.removeAttr('name');
            me.attr({ name: { first: 'Payal' } });
            equal(innerHTML(label), 'Payal', 'works after parent removed');
        });
        test('Rendering indicies of an array with @index', function () {
            var template = can.stache('<ul>{{#each list}}<li>{{@index}} {{.}}</li>{{/each}}</ul>');
            var list = [
                0,
                1,
                2,
                3
            ];
            var lis = template({ list: list }).firstChild.getElementsByTagName('li');
            for (var i = 0; i < lis.length; i++) {
                equal(innerHTML(lis[i]), i + ' ' + i, 'rendered index and value are correct');
            }
        });
        test('Rendering indicies of an array with @index + offset (#1078)', function () {
            var template = can.stache('<ul>{{#each list}}<li>{{@index 5}} {{.}}</li>{{/each}}</ul>');
            var list = [
                0,
                1,
                2,
                3
            ];
            var lis = template({ list: list }).firstChild.getElementsByTagName('li');
            for (var i = 0; i < lis.length; i++) {
                equal(innerHTML(lis[i]), i + 5 + ' ' + i, 'rendered index and value are correct');
            }
        });
        test('Passing indices into helpers as values', function () {
            var template = can.stache('<ul>{{#each list}}<li>{{test @index}} {{.}}</li>{{/each}}</ul>');
            var list = [
                0,
                1,
                2,
                3
            ];
            var lis = template({ list: list }, {
                test: function (index) {
                    return '' + index;
                }
            }).firstChild.getElementsByTagName('li');
            for (var i = 0; i < lis.length; i++) {
                equal(innerHTML(lis[i]), i + ' ' + i, 'rendered index and value are correct');
            }
        });
        test('Rendering live bound indicies with #each, @index and a simple can.List', function () {
            var list = new can.List([
                'a',
                'b',
                'c'
            ]);
            var template = can.stache('<ul>{{#each list}}<li>{{@index}} {{.}}</li>{{/each}}</ul>');
            var tpl = template({ list: list }).firstChild;
            var lis = tpl.getElementsByTagName('li');
            equal(lis.length, 3, 'three lis');
            equal(innerHTML(lis[0]), '0 a', 'first index and value are correct');
            equal(innerHTML(lis[1]), '1 b', 'second index and value are correct');
            equal(innerHTML(lis[2]), '2 c', 'third index and value are correct');
            list.push('d', 'e');
            lis = tpl.getElementsByTagName('li');
            equal(lis.length, 5, 'five lis');
            equal(innerHTML(lis[3]), '3 d', 'fourth index and value are correct');
            equal(innerHTML(lis[4]), '4 e', 'fifth index and value are correct');
            list.splice(0, 2, 'z', 'y');
            lis = tpl.getElementsByTagName('li');
            equal(lis.length, 5, 'five lis');
            equal(innerHTML(lis[0]), '0 z', 'first item updated');
            equal(innerHTML(lis[1]), '1 y', 'second item updated');
            equal(innerHTML(lis[2]), '2 c', 'third item the same');
            equal(innerHTML(lis[3]), '3 d', 'fourth item the same');
            equal(innerHTML(lis[4]), '4 e', 'fifth item the same');
            list.splice(2, 2);
            lis = tpl.getElementsByTagName('li');
            equal(lis.length, 3, 'three lis');
            equal(innerHTML(lis[0]), '0 z', 'first item the same');
            equal(innerHTML(lis[1]), '1 y', 'second item the same');
            equal(innerHTML(lis[2]), '2 e', 'fifth item now the 3rd item');
        });
        test('Rendering keys of an object with #each and @key', function () {
            var template = can.stache('<ul>{{#each obj}}<li>{{@key}} {{.}}</li>{{/each}}</ul>');
            var obj = {
                foo: 'string',
                bar: 1,
                baz: false
            };
            var lis = template({ obj: obj }).firstChild.getElementsByTagName('li');
            equal(lis.length, 3, 'three lis');
            equal(innerHTML(lis[0]), 'foo string', 'first key value pair rendered');
            equal(innerHTML(lis[1]), 'bar 1', 'second key value pair rendered');
            equal(innerHTML(lis[2]), 'baz false', 'third key value pair rendered');
        });
        test('Live bound iteration of keys of a can.Map with #each and @key', function () {
            var template = can.stache('<ul>{{#each map}}<li>{{@key}} {{.}}</li>{{/each}}</ul>');
            var map = new can.Map({
                foo: 'string',
                bar: 1,
                baz: false
            });
            var tpl = template({ map: map });
            var lis = tpl.firstChild.getElementsByTagName('li');
            equal(lis.length, 3, 'three lis');
            equal(innerHTML(lis[0]), 'foo string', 'first key value pair rendered');
            equal(innerHTML(lis[1]), 'bar 1', 'second key value pair rendered');
            equal(innerHTML(lis[2]), 'baz false', 'third key value pair rendered');
            map.attr('qux', true);
            lis = tpl.firstChild.getElementsByTagName('li');
            equal(lis.length, 4, 'four lis');
            equal(innerHTML(lis[3]), 'qux true', 'fourth key value pair rendered');
            map.removeAttr('foo');
            lis = tpl.firstChild.getElementsByTagName('li');
            equal(lis.length, 3, 'three lis');
            equal(innerHTML(lis[0]), 'bar 1', 'new first key value pair rendered');
            equal(innerHTML(lis[1]), 'baz false', 'new second key value pair rendered');
            equal(innerHTML(lis[2]), 'qux true', 'new third key value pair rendered');
        });
        test('Make sure data passed into template does not call helper by mistake', function () {
            var template = can.stache('<h1>{{text}}</h1>');
            var data = { text: 'with' };
            var h1 = template(data).firstChild;
            equal(innerHTML(h1), 'with');
        });
        test('no memory leaks with #each (#545)', function () {
            var tmp = can.stache('<ul>{{#each children}}<li></li>{{/each}}</ul>');
            var data = new can.Map({
                children: [
                    { name: 'A1' },
                    { name: 'A2' },
                    { name: 'A3' }
                ]
            });
            var div = doc.createElement('div');
            div.appendChild(tmp(data));
            stop();
            setTimeout(function () {
                can.remove(can.$(div.firstChild));
                equal(data._bindings, 0, 'there are no bindings');
                start();
            }, 50);
        });
        test('each directly within live html section', function () {
            var tmp = can.stache('<ul>{{#if showing}}' + '{{#each items}}<li>item</li>{{/items}}' + '{{/if}}</ul>');
            var items = new can.List([
                1,
                2,
                3
            ]);
            var showing = can.compute(true);
            var frag = tmp({
                showing: showing,
                items: items
            });
            showing(false);
            items.pop();
            showing(true);
            items.push('a');
            equal(frag.firstChild.getElementsByTagName('li').length, 3, 'there are 3 elements');
        });
        test('mustache loops with 0 (#568)', function () {
            var tmp = can.stache('<ul>{{#array}}<li>{{.}}</li>{{/array}}');
            var data = {
                array: [
                    0,
                    null
                ]
            };
            var frag = tmp(data);
            equal(innerHTML(frag.firstChild.getElementsByTagName('li')[0]), '0');
            equal(innerHTML(frag.firstChild.getElementsByTagName('li')[1]), '');
        });
        test('@index is correctly calculated when there are identical elements in the array', function () {
            var data = new can.List([
                'foo',
                'bar',
                'baz',
                'qux',
                'foo'
            ]);
            var tmp = can.stache('{{#each data}}{{@index}} {{/each}}');
            var div = doc.createElement('div');
            var frag = tmp({ data: data });
            div.appendChild(frag);
            equal(innerHTML(div), '0 1 2 3 4 ');
        });
        test('if helper within className (#592)', function () {
            var tmp = can.stache('<div class="fails {{#state}}animate-{{.}}{{/state}}"></div>');
            var data = new can.Map({ state: 'ready' });
            var frag = tmp(data);
            equal(frag.firstChild.className, 'fails animate-ready');
            tmp = can.stache('<div class="fails {{#if state}}animate-{{state}}{{/if}}"></div>');
            data = new can.Map({ state: 'ready' });
            tmp(data);
            equal(frag.firstChild.className, 'fails animate-ready');
        });
        test('html comments must not break mustache scanner', function () {
            can.each([
                'text<!-- comment -->',
                'text<!-- comment-->',
                'text<!--comment -->',
                'text<!--comment-->'
            ], function (content) {
                var div = doc.createElement('div');
                div.appendChild(can.stache(content)());
                equal(innerHTML(div), content, 'Content did not change: "' + content + '"');
            });
        });
        test('Rendering live bound indicies with #each, @index and a simple can.List when remove first item (#613)', function () {
            var list = new can.List([
                'a',
                'b',
                'c'
            ]);
            var template = can.stache('<ul>{{#each list}}<li>{{@index}} {{.}}</li>{{/each}}</ul>');
            var tpl = template({ list: list });
            list.shift();
            var lis = tpl.firstChild.getElementsByTagName('li');
            equal(lis.length, 2, 'two lis');
            equal(innerHTML(lis[0]), '0 b', 'second item now the 1st item');
            equal(innerHTML(lis[1]), '1 c', 'third item now the 2nd item');
        });
        test('can.stache.safestring works on live binding (#606)', function () {
            var num = can.compute(1);
            can.stache.registerHelper('safeHelper', function () {
                return can.stache.safeString('<p>' + num() + '</p>');
            });
            var template = can.stache('<div>{{safeHelper}}</div>');
            var frag = template();
            equal(frag.firstChild.firstChild.nodeName.toLowerCase(), 'p', 'got a p element');
        });
        test('directly nested subitems and each (#605)', function () {
            var template = can.stache('<div>' + '{{#item}}' + '<p>This is the item:</p>' + '{{#each subitems}}' + '<label>' + 'item' + '</label>' + '{{/each}}' + '{{/item}}' + '</div>');
            var data = new can.Map({ item: { subitems: ['first'] } });
            var frag = template(data), div = frag.firstChild, labels = div.getElementsByTagName('label');
            equal(labels.length, 1, 'initially one label');
            data.attr('item.subitems').push('second');
            labels = div.getElementsByTagName('label');
            equal(labels.length, 2, 'after pushing two label');
            data.removeAttr('item');
            labels = div.getElementsByTagName('label');
            equal(labels.length, 0, 'after removing item no label');
        });
        test('directly nested live sections unbind without needing the element to be removed', function () {
            var template = can.stache('<div>' + '{{#items}}' + '<p>first</p>' + '{{#visible}}<label>foo</label>{{/visible}}' + '<p>second</p>' + '{{/items}}' + '</div>');
            var data = new can.Map({ items: [{ visible: true }] });
            var bindings = 0;
            function bind(eventType) {
                bindings++;
                return can.Map.prototype.bind.apply(this, arguments);
            }
            function unbind(eventType) {
                can.Map.prototype.unbind.apply(this, arguments);
                bindings--;
                if (eventType === 'visible') {
                    ok(true, 'unbound visible');
                }
                if (bindings === 0) {
                    start();
                    ok(true, 'unbound visible');
                }
            }
            data.attr('items.0').bind = bind;
            data.attr('items.0').unbind = unbind;
            template(data);
            data.attr('items', [{ visible: true }]);
            stop();
        });
        test('direct live section', function () {
            var template = can.stache('{{#if visible}}<label/>{{/if}}');
            var data = new can.Map({ visible: true });
            var div = doc.createElement('div');
            div.appendChild(template(data));
            equal(div.getElementsByTagName('label').length, 1, 'there are 1 items');
            data.attr('visible', false);
            equal(div.getElementsByTagName('label').length, 0, 'there are 0 items');
        });
        test('Rendering keys of an object with #each and @key in a Component', function () {
            var template = can.stache('<ul>' + '{{#each data}}' + '<li>{{@key}} : {{.}}</li>' + '{{/data}}' + '</ul>');
            var map = new can.Map({
                data: {
                    some: 'test',
                    things: false,
                    other: 'things'
                }
            });
            var frag = template(map);
            var lis = frag.firstChild.getElementsByTagName('li');
            equal(lis.length, 3, 'there are 3 properties of map\'s data property');
            equal(innerHTML(lis[0]), 'some : test');
        });
        test('{{each}} does not error with undefined list (#602)', function () {
            var text = '<div>{{#each data}}{{name}}{{/each}}</div>';
            equal(getText(text, {}), '<div></div>', 'Empty text rendered');
            equal(getText(text, { data: false }), '<div></div>', 'Empty text rendered');
            equal(getText(text, { data: null }), '<div></div>', 'Empty text rendered');
            equal(getText(text, { data: [{ name: 'David' }] }), '<div>David</div>', 'Expected name rendered');
        });
        test('{{#each}} helper works reliably with nested sections (#604)', function () {
            var renderer = can.stache('{{#if first}}<ul>{{#each list}}<li>{{name}}</li>{{/each}}</ul>' + '{{else}}<ul>{{#each list2}}<li>{{name}}</li>{{/each}}</ul>{{/if}}');
            var data = new can.Map({
                first: true,
                list: [
                    { name: 'Something' },
                    { name: 'Else' }
                ],
                list2: [
                    { name: 'Foo' },
                    { name: 'Bar' }
                ]
            });
            var div = doc.createElement('div');
            var frag = renderer(data);
            div.appendChild(frag);
            var lis = div.getElementsByTagName('li');
            deepEqual(can.map(lis, function (li) {
                return innerHTML(li);
            }), [
                'Something',
                'Else'
            ], 'Expected HTML with first set');
            data.attr('first', false);
            lis = div.getElementsByTagName('li');
            deepEqual(can.map(lis, function (li) {
                return innerHTML(li);
            }), [
                'Foo',
                'Bar'
            ], 'Expected HTML with first false set');
        });
        test('Block bodies are properly escaped inside attributes', function () {
            var html = '<div title=\'{{#test}}{{.}}{{{.}}}{{/test}}\'></div>', div = doc.createElement('div'), title = 'Alpha&Beta';
            var frag = can.stache(html)(new can.Map({ test: title }));
            div.appendChild(frag);
            equal(div.firstChild.getAttribute('title'), title + title);
        });
        test('Constructor static properties are accessible (#634)', function () {
            can.Map.extend('can.Foo', { static_prop: 'baz' }, { proto_prop: 'thud' });
            var template = '                  Straight access: <br/>                       <span>{{own_prop}}</span><br/>                       <span>{{constructor.static_prop}}</span><br/>                       <span>{{constructor.proto_prop}}</span><br/>                       <span>{{proto_prop}}</span><br/>                   Helper argument: <br/>                       <span>{{print_prop own_prop}}</span><br/>                       <span>{{print_prop constructor.static_prop}}</span><br/>                       <span>{{print_prop constructor.proto_prop}}</span><br/>                       <span>{{print_prop proto_prop}}</span><br/>                   Helper hash argument: <br/>                       <span>{{print_hash prop=own_prop}}</span><br/>                       <span>{{print_hash prop=constructor.static_prop}}</span><br/>                       <span>{{print_hash prop=constructor.proto_prop}}</span><br/>                       <span>{{print_hash prop=proto_prop}}</span><br/>', renderer = can.stache(template), data = new can.Foo({ own_prop: 'quux' }), div = doc.createElement('div');
            div.appendChild(renderer(data, {
                print_prop: function () {
                    return can.map(can.makeArray(arguments).slice(0, arguments.length - 1), function (arg) {
                        while (arg && arg.isComputed) {
                            arg = arg();
                        }
                        return arg;
                    }).join(' ');
                },
                print_hash: function () {
                    var ret = [];
                    can.each(arguments[arguments.length - 1].hash, function (arg, key) {
                        while (arg && arg.isComputed) {
                            arg = arg();
                        }
                        ret.push([
                            key,
                            arg
                        ].join('='));
                    });
                    return ret.join(' ');
                }
            }));
            var spans = div.getElementsByTagName('span'), i = 0;
            equal(innerHTML(spans[i++]), 'quux', 'Expected "quux"');
            equal(innerHTML(spans[i++]), 'baz', 'Expected "baz"');
            equal(innerHTML(spans[i++]), '', 'Expected ""');
            equal(innerHTML(spans[i++]), 'thud', 'Expected "thud"');
            equal(innerHTML(spans[i++]), 'quux', 'Expected "quux"');
            equal(innerHTML(spans[i++]), 'baz', 'Expected "baz"');
            equal(innerHTML(spans[i++]), '', 'Expected ""');
            equal(innerHTML(spans[i++]), 'thud', 'Expected "thud"');
            equal(innerHTML(spans[i++]), 'prop=quux', 'Expected "prop=quux"');
            equal(innerHTML(spans[i++]), 'prop=baz', 'Expected "prop=baz"');
            equal(innerHTML(spans[i++]), 'prop=', 'Expected "prop="');
            equal(innerHTML(spans[i++]), 'prop=thud', 'Expected "prop=thud"');
        });
        test('{{#each}} handles an undefined list changing to a defined list (#629)', function () {
            var renderer = can.stache('    {{description}}:           <ul>           {{#each list}}                   <li>{{name}}</li>           {{/each}}           </ul>');
            var div = doc.createElement('div'), data1 = new can.Map({ description: 'Each without list' }), data2 = new can.Map({
                    description: 'Each with empty list',
                    list: []
                });
            div.appendChild(renderer(data1));
            div.appendChild(renderer(data2));
            equal(div.getElementsByTagName('ul')[0].getElementsByTagName('li').length, 0, 'there are no lis in the undefined list');
            equal(div.getElementsByTagName('ul')[1].getElementsByTagName('li').length, 0, 'there are no lis in the empty list');
            stop();
            setTimeout(function () {
                start();
                data1.attr('list', [{ name: 'first' }]);
                data2.attr('list', [{ name: 'first' }]);
                equal(div.getElementsByTagName('ul')[0].getElementsByTagName('li').length, 1, 'there should be an li as we set an attr to an array');
                equal(div.getElementsByTagName('ul')[1].getElementsByTagName('li').length, 1);
                equal(innerHTML(div.getElementsByTagName('ul')[0].getElementsByTagName('li')[0]), 'first');
                equal(innerHTML(div.getElementsByTagName('ul')[1].getElementsByTagName('li')[0]), 'first');
            }, 250);
        });
        test('can.compute should live bind when the value is changed to a Construct (#638)', function () {
            var renderer = can.stache('<p>{{#counter}} Clicked <span>{{count}}</span> times {{/counter}}</p>'), div = doc.createElement('div'), counter = can.compute(), data = { counter: counter };
            div.appendChild(renderer(data));
            equal(div.getElementsByTagName('span').length, 0);
            stop();
            setTimeout(function () {
                start();
                counter({ count: 1 });
                equal(div.getElementsByTagName('span').length, 1);
                equal(innerHTML(div.getElementsByTagName('span')[0]), '1');
            }, 10);
        });
        test('@index in partials loaded from script templates', function () {
            if (!(doc instanceof SimpleDOM.Document)) {
                var script = doc.createElement('script');
                script.type = 'text/mustache';
                script.id = 'itempartial';
                script.text = '<label></label>';
                doc.body.appendChild(script);
                var itemsTemplate = can.stache('<div>' + '{{#each items}}' + '{{>itempartial}}' + '{{/each}}' + '</div>');
                var items = new can.List([
                    {},
                    {}
                ]);
                var frag = itemsTemplate({ items: items }), div = frag.firstChild, labels = div.getElementsByTagName('label');
                equal(labels.length, 2, 'two labels');
                items.shift();
                labels = div.getElementsByTagName('label');
                equal(labels.length, 1, 'first label removed');
            } else {
                expect(0);
            }
        });
        test('#each with #if directly nested (#750)', function () {
            var template = can.stache('<ul>{{#each list}} {{#if visible}}<li>{{name}}</li>{{/if}} {{/each}}</ul>');
            var data = new can.Map({
                list: [
                    {
                        name: 'first',
                        visible: true
                    },
                    {
                        name: 'second',
                        visible: false
                    },
                    {
                        name: 'third',
                        visible: true
                    }
                ]
            });
            var frag = template(data);
            data.attr('list').pop();
            equal(frag.firstChild.getElementsByTagName('li').length, 1, 'only first should be visible');
        });
        test('can.view.tag', function () {
            expect(4);
            can.view.tag('stache-tag', function (el, tagData) {
                ok(tagData.scope instanceof can.view.Scope, 'got scope');
                ok(tagData.options instanceof can.view.Scope, 'got options');
                equal(typeof tagData.subtemplate, 'function', 'got subtemplate');
                var frag = tagData.subtemplate(tagData.scope.add({ last: 'Meyer' }), tagData.options);
                equal(innerHTML(frag.firstChild), 'Justin Meyer', 'rendered right');
            });
            var template = can.stache('<stache-tag><span>{{first}} {{last}}</span></stache-tag>');
            template({ first: 'Justin' });
        });
        test('can.view.attr', function () {
            expect(3);
            can.view.attr('stache-attr', function (el, attrData) {
                ok(attrData.scope instanceof can.view.Scope, 'got scope');
                ok(attrData.options instanceof can.view.Scope, 'got options');
                equal(attrData.attributeName, 'stache-attr', 'got attribute name');
            });
            var template = can.stache('<div stache-attr=\'foo\'></div>');
            template({});
        });
        test('./ in key', function () {
            var template = can.stache('<div><label>{{name}}</label>{{#children}}<span>{{./name}}-{{name}}</span>{{/children}}</div>');
            var data = {
                name: 'CanJS',
                children: [
                    {},
                    { name: 'stache' }
                ]
            };
            var res = template(data);
            var spans = res.firstChild.getElementsByTagName('span');
            equal(innerHTML(spans[0]), '-CanJS', 'look in current level');
            equal(innerHTML(spans[1]), 'stache-stache', 'found in current level');
        });
        test('self closing tags callback custom tag callbacks (#880)', function () {
            can.view.tag('stache-tag', function (el, tagData) {
                ok(true, 'tag callback called');
                equal(tagData.scope.attr('.').foo, 'bar', 'got scope');
                ok(!tagData.subtemplate, 'there is no subtemplate');
            });
            var template = can.stache('<div><stache-tag/></div>');
            template({ foo: 'bar' });
        });
        test('empty custom tags do not have a subtemplate (#880)', function () {
            can.view.tag('stache-tag', function (el, tagData) {
                ok(true, 'tag callback called');
                equal(tagData.scope.attr('.').foo, 'bar', 'got scope');
                ok(!tagData.subtemplate, 'there is no subtemplate');
            });
            var template = can.stache('<div><stache-tag></stache-tag></div>');
            template({ foo: 'bar' });
        });
        test('inverse in tag', function () {
            var template = can.stache('<span {{^isBlack}} style="display:none"{{/if}}>Hi</span>');
            var res = template({ isBlack: false });
            ok(/display:\s*none/.test(res.firstChild.getAttribute('style')), 'display none is not set');
        });
        test('Calling .fn without arguments should forward scope by default (#658)', function () {
            var tmpl = '{{#foo}}<span>{{bar}}</span>{{/foo}}';
            var frag = can.stache(tmpl)(new can.Map({ bar: 'baz' }), {
                foo: function (opts) {
                    return opts.fn();
                }
            });
            var node = frag.firstChild;
            equal(innerHTML(node), 'baz', 'Context is forwarded correctly');
        });
        test('Calling .fn with falsy value as the context will render correctly (#658)', function () {
            var tmpl = '{{#zero}}<span>{{ . }}</span>{{/zero}}{{#emptyString}}<span>{{ . }}</span>{{/emptyString}}{{#nullVal}}<span>{{ . }}</span>{{/nullVal}}';
            var frag = can.stache(tmpl)({ foo: 'bar' }, {
                zero: function (opts) {
                    return opts.fn(0);
                },
                emptyString: function (opts) {
                    return opts.fn('');
                },
                nullVal: function (opts) {
                    return opts.fn(null);
                }
            });
            equal(innerHTML(frag.firstChild), '0', 'Context is set correctly for falsy values');
            equal(innerHTML(frag.childNodes.item(1)), '', 'Context is set correctly for falsy values');
            equal(innerHTML(frag.childNodes.item(2)), '', 'Context is set correctly for falsy values');
        });
        test('Custom elements created with default namespace in IE8', function () {
            can.view.tag('my-tag', function () {
            });
            var tmpl = '<my-tag></my-tag>';
            var frag = can.stache(tmpl)({});
            can.append(this.$fixture, frag);
            equal(this.fixture.getElementsByTagName('my-tag').length, 1, 'Element created in default namespace');
        });
        test('Partials are passed helpers (#791)', function () {
            var t = {
                    template: '{{>partial}}',
                    expected: 'foo',
                    partials: { partial: '{{ help }}' },
                    helpers: {
                        'help': function () {
                            return 'foo';
                        }
                    }
                }, frag;
            for (var name in t.partials) {
                can.view.registerView(name, t.partials[name], '.stache');
            }
            frag = can.stache(t.template)({}, t.helpers);
            equal(frag.firstChild.nodeValue, t.expected);
        });
        test('{{else}} with {{#unless}} (#988)', function () {
            var tmpl = '<div>{{#unless noData}}data{{else}}no data{{/unless}}</div>';
            var frag = can.stache(tmpl)({ noData: true });
            equal(innerHTML(frag.firstChild), 'no data', 'else with unless worked');
        });
        test('{{else}} within an attribute (#974)', function () {
            var tmpl = '<div class="{{#if color}}{{color}}{{else}}red{{/if}}"></div>', data = new can.Map({ color: 'orange' }), frag = can.stache(tmpl)(data);
            equal(frag.firstChild.className, 'orange', 'if branch');
            data.attr('color', false);
            equal(frag.firstChild.className, 'red', 'else branch');
        });
        test('returns correct value for DOM attributes (#1065)', 3, function () {
            var template = '<h2 class="{{#if shown}}foo{{/if}} test1 {{#shown}}muh{{/shown}}"></h2>' + '<h3 class="{{#if shown}}bar{{/if}} test2 {{#shown}}kuh{{/shown}}"></h3>' + '<h4 class="{{#if shown}}baz{{/if}} test3 {{#shown}}boom{{/shown}}"></h4>';
            var frag = can.stache(template)({ shown: true });
            equal(frag.firstChild.className, 'foo test1 muh');
            equal(frag.childNodes.item(1).className, 'bar test2 kuh');
            equal(frag.childNodes.item(2).className, 'baz test3 boom');
        });
        test('single character attributes work (#1132)', function () {
            if (doc.createElementNS) {
                var template = '<svg width="50" height="50">' + '<circle r="25" cx="25" cy="25"></circle>' + '</svg>';
                var frag = can.stache(template)({});
                equal(frag.firstChild.firstChild.getAttribute('r'), '25');
            } else {
                expect(0);
            }
        });
        test('single property read does not infinitely loop (#1155)', function () {
            stop();
            var map = new can.Map({ state: false });
            var current = false;
            var source = can.compute(1);
            var number = can.compute(function () {
                map.attr('state', current = !current);
                return source();
            });
            number.bind('change', function () {
            });
            var template = can.stache('<div>{{#if map.state}}<span>Hi</span>{{/if}}</div>');
            template({ map: map });
            source(2);
            map.attr('state', current = !current);
            ok(true, 'no error at this point');
            start();
        });
        test('methods become observable (#1164)', function () {
            var TeamModel = can.Map.extend({
                shortName: function () {
                    return this.attr('nickname') && this.attr('nickname').length <= 8 ? this.attr('nickname') : this.attr('abbreviation');
                }
            });
            var team = new TeamModel({
                nickname: 'Arsenal London',
                abbreviation: 'ARS'
            });
            var template = can.stache('<span>{{team.shortName}}</span>');
            var frag = template({ team: team });
            equal(innerHTML(frag.firstChild), 'ARS', 'got value');
        });
        test('<col> inside <table> renders correctly (#1013)', 1, function () {
            var template = '<table><colgroup>{{#columns}}<col class="{{class}}" />{{/columns}}</colgroup><tbody></tbody></table>';
            var frag = can.stache(template)({ columns: new can.List([{ 'class': 'test' }]) });
            var index = getChildNodes(frag).length === 2 ? 1 : 0;
            var tagName = frag.childNodes.item(index).firstChild.firstChild.tagName.toLowerCase();
            equal(tagName, 'col', '<col> nodes added in proper position');
        });
        test('splicing negative indices works (#1038)', function () {
            var template = '{{#each list}}<p>{{.}}</p>{{/each}}';
            var list = new can.List([
                'a',
                'b',
                'c',
                'd'
            ]);
            var frag = can.stache(template)({ list: list });
            var children = getChildNodes(frag).length;
            list.splice(-1);
            equal(getChildNodes(frag).length, children - 1, 'Child node removed');
        });
        test('stache can accept an intermediate (#1387)', function () {
            var template = '<div class=\'{{className}}\'>{{message}}</div>';
            var intermediate = can.view.parser(template, {}, true);
            var renderer = can.stache(intermediate);
            var frag = renderer({
                className: 'foo',
                message: 'bar'
            });
            equal(frag.firstChild.className, 'foo', 'correct class name');
            equal(innerHTML(frag.firstChild), 'bar', 'correct innerHTMl');
        });
        test('Passing Partial set in options (#1388 and #1389). Support live binding of partial', function () {
            var data = new can.Map({
                name: 'World',
                greeting: 'hello'
            });
            can.view.registerView('hello', 'hello {{name}}', '.stache');
            can.view.registerView('goodbye', 'goodbye {{name}}', '.stache');
            var template = can.stache('<div>{{>greeting}}</div>')(data);
            var div = doc.createElement('div');
            div.appendChild(template);
            equal(innerHTML(div.firstChild), 'hello World', 'partial retreived and rendered');
            data.attr('greeting', 'goodbye');
            equal(innerHTML(div.firstChild), 'goodbye World', 'Partial updates when attr is updated');
        });
        test('#each with null or undefined and then a list', function () {
            var template = can.stache('<ul>{{#each items}}<li>{{name}}</li>{{/each}}');
            var data = new can.Map({ items: null });
            var frag = template(data);
            var div = doc.createElement('div');
            div.appendChild(frag);
            data.attr('items', [{ name: 'foo' }]);
            equal(div.getElementsByTagName('li').length, 1, 'li added');
        });
        test('promises work (#179)', function () {
            var template = can.stache('{{#if promise.isPending}}<span class=\'pending\'></span>{{/if}}' + '{{#if promise.isRejected}}<span class=\'rejected\'>{{promise.reason.message}}</span>{{/if}}' + '{{#if promise.isResolved}}<span class=\'resolved\'>{{promise.value.message}}</span>{{/if}}');
            var def = new can.Deferred();
            var data = { promise: def.promise() };
            var frag = template(data);
            var rootDiv = doc.createElement('div');
            rootDiv.appendChild(frag);
            var spans = rootDiv.getElementsByTagName('span');
            equal(spans.length, 1);
            equal(spans[0].getAttribute('class'), 'pending');
            stop();
            def.resolve({ message: 'Hi there' });
            setTimeout(function () {
                spans = rootDiv.getElementsByTagName('span');
                equal(spans.length, 1);
                equal(spans[0].getAttribute('class'), 'resolved');
                equal(innerHTML(spans[0]), 'Hi there');
                var def = new can.Deferred();
                var data = { promise: def.promise() };
                var frag = template(data);
                var div = doc.createElement('div');
                div.appendChild(frag);
                spans = div.getElementsByTagName('span');
                def.reject({ message: 'BORKED' });
                setTimeout(function () {
                    spans = div.getElementsByTagName('span');
                    equal(spans.length, 1);
                    equal(spans[0].getAttribute('class'), 'rejected');
                    equal(innerHTML(spans[0]), 'BORKED');
                    start();
                }, 30);
            }, 30);
        });
        test('{#list} works right (#1551)', function () {
            var data = new can.Map({});
            var template = can.stache('<div>{{#items}}<span/>{{/items}}</div>');
            var frag = template(data);
            data.attr('items', new can.List());
            data.attr('items').push('foo');
            var spans = frag.firstChild.getElementsByTagName('span');
            equal(spans.length, 1, 'one span');
        });
        test('promises are not rebound (#1572)', function () {
            stop();
            var d = new can.Deferred();
            var compute = can.compute(d);
            var template = can.stache('<div>{{#if promise.isPending}}<span/>{{/if}}</div>');
            var frag = template({ promise: compute });
            var div = frag.firstChild, spans = div.getElementsByTagName('span');
            var d2 = new can.Deferred();
            compute(d2);
            setTimeout(function () {
                d2.resolve('foo');
                setTimeout(function () {
                    spans = div.getElementsByTagName('span');
                    equal(spans.length, 0, 'there should be no spans');
                    start();
                }, 30);
            }, 10);
        });
        test('reading alternate values on promises (#1572)', function () {
            var promise = new can.Deferred();
            promise.myAltProp = 'AltValue';
            var template = can.stache('<div>{{d.myAltProp}}</div>');
            var frag = template({ d: promise });
            equal(innerHTML(frag.firstChild), 'AltValue', 'read value');
        });
        test('don\'t setup live binding for raw data with seciton helper', function () {
            expect(0);
            var template = can.stache('<ul>{{#animals}}' + '<li></li>' + '{{/animals}}</ul>');
            var oldBind = can.bind;
            can.bind = function (ev) {
                if (ev === 'removed') {
                    ok(false, 'listening to element removed b/c you are live binding');
                }
                oldBind.apply(this, arguments);
            };
            template({ animals: this.animals });
            can.bind = oldBind;
        });
        test('possible to teardown immediate nodeList (#1593)', function () {
            expect(3);
            var map = new can.Map({ show: true });
            var oldBind = map.bind, oldUnbind = map.unbind;
            map.bind = function () {
                ok(true, 'bound', 'bound');
                return oldBind.apply(this, arguments);
            };
            map.unbind = function () {
                ok(true, 'unbound', 'unbound');
                return oldUnbind.apply(this, arguments);
            };
            var template = can.stache('{{#if show}}<span/>TEXT{{/if}}');
            var nodeList = can.view.nodeLists.register([], undefined, true);
            var frag = template(map, {}, nodeList);
            can.view.nodeLists.update(nodeList, can.childNodes(frag));
            equal(nodeList.length, 1, 'our nodeList has the nodeList of #if show');
            can.view.nodeLists.unregister(nodeList);
            stop();
            setTimeout(function () {
                start();
            }, 10);
        });
        test('#1590 #each with surrounding block and setter', function () {
            var product = can.compute();
            var people = can.compute(function () {
                var newList = new can.List();
                newList.replace(['Brian']);
                return newList;
            });
            var frag = can.stache('<div>{{#if product}}<div>{{#each people}}<span/>{{/each}}</div>{{/if}}</div>')({
                people: people,
                product: product
            });
            can.batch.start();
            product(1);
            can.batch.stop();
            equal(frag.firstChild.getElementsByTagName('span').length, 1, 'no duplicates');
        });
        if (doc.createElementNS) {
            test('svg elements for (#1327)', function () {
                var template = can.stache('<svg height="120" width="400">' + '<circle cx="50" cy="50" r="{{radius}}" stroke="black" stroke-width="3" fill="blue" />' + '</svg>');
                var frag = template({ radius: 6 });
                equal(frag.firstChild.namespaceURI, 'http://www.w3.org/2000/svg', 'svg namespace');
            });
        }
        test('using #each when toggling between list and null', function () {
            var state = new can.Map();
            var frag = can.stache('{{#each deepness.rows}}<div></div>{{/each}}')(state);
            state.attr('deepness', { rows: ['test'] });
            state.attr('deepness', null);
            equal(can.childNodes(frag).length, 1, 'only the placeholder textnode');
        });
        test('compute defined after template (#1617)', function () {
            var myMap = new can.Map();
            var frag = can.stache('<span>{{ myMap.test }}</span>')({ myMap: myMap });
            myMap.attr('test', can.compute(function () {
                return 'def';
            }));
            equal(frag.firstChild.firstChild.nodeValue, 'def', 'correct value');
        });
        test('template with a block section and nested if doesnt render correctly', function () {
            var myMap = new can.Map({ bar: true });
            var frag = can.stache('{{#bar}}<div>{{#if foo}}My Meals{{else}}My Order{{/if}}</div>{{/bar}}')(myMap);
            equal(innerHTML(frag.firstChild), 'My Order', 'shows else case');
            myMap.attr('foo', true);
            equal(innerHTML(frag.firstChild), 'My Meals', 'shows if case');
        });
        test('registerSimpleHelper', 3, function () {
            var template = can.stache('<div>Result: {{simple first second}}</div>');
            can.stache.registerSimpleHelper('simple', function (first, second) {
                equal(first, 2);
                equal(second, 4);
                return first + second;
            });
            var frag = template(new can.Map({
                first: 2,
                second: 4
            }));
            equal(innerHTML(frag.firstChild), 'Result: 6');
        });
        test('Helper handles list replacement (#1652)', 3, function () {
            var state = new can.Map({ list: [] });
            var helpers = {
                listHasLength: function (options) {
                    ok(true, 'listHasLength helper evaluated');
                    return this.attr('list').attr('length') ? options.fn() : options.inverse();
                }
            };
            can.stache('{{#listHasLength}}{{/listHasLength}}')(state, helpers);
            state.attr('list', []);
            state.attr('list').push('...');
        });
        test('Helper binds to nested properties (#1651)', function () {
            var nestedAttrsCount = 0, state = new can.Map({ parent: null });
            var helpers = {
                bindViaNestedAttrs: function (options) {
                    nestedAttrsCount++;
                    if (nestedAttrsCount === 3) {
                        ok(true, 'bindViaNestedAttrs helper evaluated 3 times');
                    }
                    return this.attr('parent') && this.attr('parent').attr('child') ? options.fn() : options.inverse();
                }
            };
            can.stache('{{#bindViaNestedAttrs}}{{/bindViaNestedAttrs}}')(state, helpers);
            state.attr('parent', { child: 'foo' });
            state.attr('parent.child', 'bar');
        });
        test('Using a renderer function as a partial', function () {
            var template = can.stache('{{> other}}');
            var partial = can.stache('hello there');
            var map = new can.Map({ other: null });
            var frag = template(map);
            equal(frag.firstChild.nodeValue, '', 'Initially it is a blank textnode');
            map.attr('other', partial);
            equal(frag.firstChild.nodeValue, 'hello there', 'partial rendered');
        });
        test('Handlebars helper: switch/case', function () {
            var expected;
            var t = {
                template: '{{#switch ducks}}{{#case "10"}}10 ducks{{/case}}' + '{{#default}}Not 10 ducks{{/default}}{{/switch}}',
                expected: '10 ducks',
                data: {
                    ducks: '10',
                    tenDucks: function () {
                        return '10';
                    }
                },
                liveData: new can.Map({
                    ducks: '10',
                    tenDucks: function () {
                        return '10';
                    }
                })
            };
            expected = t.expected.replace(/&quot;/g, '&#34;').replace(/\r\n/g, '\n');
            deepEqual(getText(t.template, t.data), expected);
            deepEqual(getText(t.template, t.liveData), expected);
            t.data.ducks = 5;
            deepEqual(getText(t.template, t.data), 'Not 10 ducks');
        });
        test('Handlerbars helper: switch - changing to default (#1857)', function () {
            var template = can.stache('{{#switch ducks}}{{#case "10"}}10 ducks{{/case}}' + '{{#default}}Not 10 ducks{{/default}}{{/switch}}');
            var map = new can.Map({ ducks: '10' });
            var frag = template(map);
            deepEqual(getTextFromFrag(frag), '10 ducks');
            map.attr('ducks', '12');
            deepEqual(getTextFromFrag(frag), 'Not 10 ducks');
        });
        test('joinBase helper joins to the baseURL', function () {
            can.baseURL = 'http://foocdn.com/bitovi';
            var template = can.stache('{{joinBase \'hello/\' name}}');
            var map = new can.Map({ name: 'world' });
            var frag = template(map);
            equal(frag.firstChild.nodeValue, 'http://foocdn.com/bitovi/hello/world', 'joined from can.baseUrl');
            can.baseUrl = undefined;
        });
        test('joinBase helper can be relative to template module', function () {
            var baseUrl = 'http://foocdn.com/bitovi';
            var template = can.stache('{{joinBase \'../hello/\' name}}');
            var map = new can.Map({ name: 'world' });
            var frag = template(map, { module: { uri: baseUrl } });
            equal(frag.firstChild.nodeValue, 'http://foocdn.com/hello/world', 'relative lookup works');
        });
        test('Custom attribute callbacks are called when in a conditional within a live section', 8, function () {
            can.view.attr('test-attr', function (el, attrData) {
                ok(true, 'test-attr called');
                equal(attrData.attributeName, 'test-attr', 'attributeName set correctly');
                ok(attrData.scope, 'scope isn\'t undefined');
                ok(attrData.options, 'options isn\'t undefined');
            });
            var state = new can.Map({ showAttr: true });
            var template = can.stache('<button id="find-me" {{#if showAttr}}test-attr{{/if}}></button>');
            template(state);
            state.attr('showAttr', false);
            state.attr('showAttr', true);
        });
        test('inner expressions (#1769)', function () {
            var template = can.stache('{{helperA helperB(1,valueA,propA=valueB propC=2) \'def\' outerPropA=helperC(2, ~valueB)}}');
            var frag = template(new can.Map({
                valueA: 'A',
                valueB: 'B'
            }), {
                helperA: function (arg1, arg2, options) {
                    equal(arg1(), 'helperB value', 'call expression argument to helperA');
                    equal(arg2, 'def', 'scope argument');
                    equal(options.hash.outerPropA(), 'helperC value', 'scope hash');
                    return 'helperA value';
                },
                helperB: function (arg1, arg2, options) {
                    equal(arg1, 1, 'static argument');
                    equal(arg2, 'A', 'scope argument');
                    equal(options.propA, 'B', 'scope hash');
                    equal(options.propC, 2, 'static hash');
                    return 'helperB value';
                },
                helperC: function (arg1, arg2) {
                    equal(arg1, 2, 'helperC static argument');
                    equal(arg2(), 'B', 'helperC scope argument');
                    return 'helperC value';
                }
            });
            equal(frag.firstChild.nodeValue, 'helperA value');
        });
        test('inner expressions with computes', function () {
            var template = can.stache('{{helperA helperB(1,valueA,propA=valueB propC=2) \'def\' outerPropA=helperC(2,valueB)}}');
            var valueB = can.compute('B');
            var changes = 0;
            var frag = template({
                valueA: 'A',
                valueB: valueB
            }, {
                helperA: function (arg1, arg2, options) {
                    if (changes === 0) {
                        equal(arg1(), 'helperB=B', 'static argument');
                        equal(options.hash.outerPropA(), 'helperC=B', 'scope hash 0');
                    } else {
                        equal(arg1(), 'helperB=X', 'static argument');
                        equal(options.hash.outerPropA(), 'helperC=X', 'scope hash 1');
                    }
                    equal(arg2, 'def', 'scope argument');
                    return arg1() + '-' + options.hash.outerPropA();
                },
                helperB: function (arg1, arg2, options) {
                    equal(arg1, 1, 'static argument');
                    equal(arg2, 'A', 'scope argument');
                    if (changes === 0) {
                        equal(options.propA, 'B', 'scope hash');
                    } else {
                        equal(options.propA, 'X', 'scope hash');
                    }
                    equal(options.propC, 2, 'static hash');
                    return 'helperB=' + options.propA;
                },
                helperC: function (arg1, arg2) {
                    equal(arg1, 2, 'helperC static argument');
                    if (changes === 0) {
                        equal(arg2, 'B', 'helperC scope argument');
                    } else {
                        equal(arg2, 'X', 'helperC scope argument');
                    }
                    return 'helperC=' + arg2;
                }
            });
            equal(frag.firstChild.nodeValue, 'helperB=B-helperC=B');
            changes++;
            can.batch.start();
            valueB('X');
            can.batch.stop();
            equal(frag.firstChild.nodeValue, 'helperB=X-helperC=X');
        });
        test('parent scope functions not called with arguments (#1833)', function () {
            var data = {
                child: { value: 1 },
                method: function (arg) {
                    equal(arg, 1, 'got the right arg');
                }
            };
            var template = can.stache('{{#child}}{{method value}}{{/child}}');
            template(data);
        });
        test('call expression - simple', function () {
            var template = can.stache('{{method(arg)}}');
            var age = can.compute(32);
            var frag = template({
                method: function (num) {
                    return num * 2;
                },
                arg: age
            });
            equal(frag.firstChild.nodeValue, '64', 'method call works');
        });
        test('call expression #each passed list', function () {
            var animals = new can.List([
                    'sloth',
                    'bear'
                ]), renderer = can.stache('<div>my<b>favorite</b>animals:{{#eachOf(animals)}}<label>Animal=</label> <span>{{this}}</span>{{/}}!</div>');
            var div = doc.createElement('div');
            var frag = renderer({ animals: animals });
            div.appendChild(frag);
            div.getElementsByTagName('label')[0].myexpando = 'EXPANDO-ED';
            equal(div.getElementsByTagName('label').length, 2, 'There are 2 labels');
            animals.push('turtle');
            equal(div.getElementsByTagName('label')[0].myexpando, 'EXPANDO-ED', 'same expando');
            equal(innerHTML(div.getElementsByTagName('span')[2]), 'turtle', 'turtle added');
        });
        test('call expression #each passed compute', function () {
            var animals = can.compute(new can.List([
                    'sloth',
                    'bear'
                ])), renderer = can.stache('<div>my<b>favorite</b>animals:{{#eachOf(~animals)}}<label>Animal=</label> <span>{{this}}</span>{{/}}!</div>');
            var div = doc.createElement('div');
            var frag = renderer({ animals: animals });
            div.appendChild(frag);
            div.getElementsByTagName('label')[0].myexpando = 'EXPANDO-ED';
            equal(div.getElementsByTagName('label').length, 2, 'There are 2 labels');
            animals(new can.List([
                'sloth',
                'bear',
                'turtle'
            ]));
            equal(div.getElementsByTagName('label')[0].myexpando, 'EXPANDO-ED', 'same expando');
            equal(innerHTML(div.getElementsByTagName('span')[2]), 'turtle', 'turtle added');
        });
        test('call expression with #if', function () {
            var truthy = can.compute(true);
            var template = can.stache('{{#if(truthy)}}true{{else}}false{{/if}}');
            var frag = template({ truthy: truthy });
            equal(frag.firstChild.nodeValue, 'true', 'set to true');
            truthy(false);
            equal(frag.firstChild.nodeValue, 'false', 'set to false');
        });
        test('getHelper w/o optional options argument (#1497)', function () {
            var options = can.stache.getHelper('each');
            ok(typeof options.fn === 'function', 'each helper returned');
        });
        test('methods don\'t update correctly (#1891)', function () {
            var map = new can.Map({
                num1: 1,
                num2: function () {
                    return this.attr('num1') * 2;
                }
            });
            var frag = can.stache('<span class="num1">{{num1}}</span>' + '<span class="num2">{{num2}}</span>')(map);
            equal(frag.firstChild.firstChild.nodeValue, '1', 'Rendered correct value');
            equal(frag.lastChild.firstChild.nodeValue, '2', 'Rendered correct value');
            map.attr('num1', map.attr('num1') * 2);
            equal(frag.firstChild.firstChild.nodeValue, '2', 'Rendered correct value');
            equal(frag.lastChild.firstChild.nodeValue, '4', 'Rendered correct value');
        });
        test('eq called twice (#1931)', function () {
            expect(1);
            var oldIs = can.stache.getHelper('is').fn;
            can.stache.registerHelper('is', function () {
                ok(true, 'comparator invoked');
                return oldIs.apply(this, arguments);
            });
            var a = can.compute(0), b = can.compute(0);
            can.stache('{{eq a b}}')({
                a: a,
                b: b
            });
            can.batch.start();
            a(1);
            b(1);
            can.batch.stop();
            can.stache.registerHelper('is', oldIs);
        });
        test('#each with else works (#1979)', function () {
            var list = new can.List([
                'a',
                'b'
            ]);
            var template = can.stache('<div>{{#each list}}<span>{{.}}</span>{{else}}<label>empty</label>{{/each}}</div>');
            var frag = template({ list: list });
            list.replace([]);
            var labels = frag.firstChild.getElementsByTagName('label');
            equal(labels.length, 1, 'empty case');
        });
        test('Re-evaluating a case in a switch (#1988)', function () {
            var template = can.stache('{{#switch page}}{{#case \'home\'}}<h1 id=\'home\'>Home</h1>' + '{{/case}}{{#case \'users\'}}{{#if slug}}<h1 id=\'user\'>User - {{slug}}</h1>' + '{{else}}<h1 id=\'users\'>Users</h1><ul><li>User 1</li><li>User 2</li>' + '</ul>{{/if}}{{/case}}{{/switch}}');
            var map = new can.Map({ page: 'home' });
            var frag = template(map);
            equal(frag.firstChild.getAttribute('id'), 'home', '\'home\' is the first item shown');
            map.attr('page', 'users');
            equal(frag.firstChild.nextSibling.getAttribute('id'), 'users', '\'users\' is the item shown when the page is users');
            map.attr('slug', 'Matthew');
            equal(frag.firstChild.nextSibling.getAttribute('id'), 'user', '\'user\' is the item shown when the page is users and there is a slug');
            can.batch.start();
            map.attr('page', 'home');
            map.removeAttr('slug');
            can.batch.stop();
            equal(frag.firstChild.getAttribute('id'), 'home', '\'home\' is the first item shown');
            equal(frag.firstChild.nextSibling.nodeType, 3, 'the next sibling is a TextNode');
            equal(frag.firstChild.nextSibling.nextSibling, undefined, 'there are no more nodes');
        });
        test('#each passed a method (2001)', function () {
            var users = new can.List([
                {
                    name: 'Alexis',
                    num: 4,
                    age: 88
                },
                {
                    name: 'Brian',
                    num: 2,
                    age: 31
                }
            ]);
            var template = can.stache('<div>{{#each people}}<span/>{{/each}}</div>');
            var VM = can.Map.extend({
                people: function () {
                    return this.attr('users');
                },
                remove: function () {
                    $('#content').empty();
                }
            });
            var frag = template(new VM({ users: users })), div = frag.firstChild, spans = div.getElementsByTagName('span');
            equal(spans.length, 2, 'two spans');
            can.append(this.$fixture, frag);
            stop();
            setTimeout(function () {
                start();
                can.remove(can.$(div));
                ok(true, 'removed without breaking');
            }, 10);
        });
        test('Rendering live bound indicies with #each, @index and a simple can.List (#2067)', function () {
            var list = new can.List([
                { value: 'a' },
                { value: 'b' },
                { value: 'c' }
            ]);
            var template = can.stache('<ul>{{#each list}}<li>{{%index}} {{value}}</li>{{/each}}</ul>');
            var tpl = template({ list: list }).firstChild;
            var lis = tpl.getElementsByTagName('li');
            equal(lis.length, 3, 'three lis');
            equal(innerHTML(lis[0]), '0 a', 'first index and value are correct');
            equal(innerHTML(lis[1]), '1 b', 'second index and value are correct');
            equal(innerHTML(lis[2]), '2 c', 'third index and value are correct');
        });
        test('%index content should be skipped by ../ (#1554)', function () {
            var list = new can.List([
                'a',
                'b'
            ]);
            var tmpl = can.stache('{{#each items}}<li>{{.././items.indexOf .}}</li>{{/each}}');
            var frag = tmpl({ items: list });
            equal(frag.lastChild.firstChild.nodeValue, '1', 'read indexOf');
        });
        test('rendering style tag (#2035)', function () {
            var map = new can.Map({ color: 'green' });
            var frag = can.stache('<style>body {color: {{color}} }</style>')(map);
            var content = frag.firstChild.firstChild.nodeValue;
            equal(content, 'body {color: green }', 'got the right style text');
            map = new can.Map({ showGreen: true });
            frag = can.stache('<style>body {color: {{#showGreen}}green{{/showGreen}} }</style>')(map);
            content = frag.firstChild.firstChild.nodeValue;
            equal(content, 'body {color: green }', 'sub expressions work');
        });
        test('checked as a custom attribute', function () {
            var map = new can.Map({ preview: true });
            var frag = can.stache('<div {{#if preview}}checked{{/if}}></div>')(map);
            equal(frag.firstChild.getAttribute('checked'), '', 'got attribute');
        });
        test('sections with attribute spacing (#2097)', function () {
            var template = can.stache('<div {{#foo}} disabled {{/foo}}>');
            var frag = template({ foo: true });
            equal(frag.firstChild.getAttribute('disabled'), '', 'disabled set');
        });
        test('keep @index working with multi-dimensional arrays (#2127)', function () {
            var data = new can.Map({
                array2: [
                    ['asd'],
                    ['sdf']
                ]
            });
            var template = can.stache('<div>{{#each array2}}<span>{{@index}}</span>{{/each}}</div>');
            var frag = template(data);
            var spans = frag.firstChild.getElementsByTagName('span');
            equal(spans[0].firstChild.nodeValue, '0');
        });
        test('partials are not working within an {{#each}} (#2174)', function () {
            var data = new can.Map({
                items: [{ name: 'foo' }],
                itemRender: can.stache('{{name}}')
            });
            var renderer = can.stache('<div>{{#each items}}{{>itemRender}}{{/each}}</div>');
            var frag = renderer(data);
            data.attr('items.0.name', 'WORLD');
            data.attr('items').splice(0, 0, { name: 'HELLO' });
            equal(innerHTML(frag.firstChild), 'HELLOWORLD');
        });
        test('partials don\'t leak (#2174)', function () {
            can.stache.registerHelper('somethingCrazy', function (name, options) {
                return function (el) {
                    var nodeList = [el];
                    nodeList.expression = 'something crazy';
                    can.view.nodeLists.register(nodeList, function () {
                        ok(true, 'nodeList torn down');
                    }, options.nodeList, true);
                    can.view.nodeLists.update(options.nodeList, [el]);
                };
            });
            var data = new can.Map({
                items: [{ name: 'foo' }],
                itemRender: can.stache('{{somethingCrazy name}}')
            });
            var renderer = can.stache('<div>{{#each items}}{{>itemRender}}{{/each}}</div>');
            renderer(data);
            data.attr('items').pop();
        });
        test('partials should leave binding to helpers and properties (#2174)', function () {
            can.view.registerView('test', '<input id="one"> {{name}}');
            var renderer = can.stache('{{#each items}}{{>test}}{{/each}}');
            var data = new can.Map({ items: [] });
            var frag = renderer(data);
            data.attr('items').splice(0, 0, { name: 'bob' });
            frag.firstChild.nextSibling.setAttribute('value', 'user text');
            data.attr('items.0.name', 'dave');
            equal(frag.firstChild.nextSibling.getAttribute('value'), 'user text');
        });
        test('nested switch statement fail (#2188)', function () {
            var template = can.stache('<div>{{#switch outer}}' + '{{#case "outerValue1"}}' + '{{#switch inner}}' + '{{#case \'innerValue1\'}}' + 'INNER1' + '{{/case}}' + '{{/switch}}' + '{{/case}}' + '{{#case "outerValue2"}}' + 'OUTER2' + '{{/case}}' + '{{/switch}}</div>');
            var vm = new can.Map({
                outer: 'outerValue1',
                inner: 'innerValue1'
            });
            var frag = template(vm);
            can.batch.start();
            vm.removeAttr('inner');
            vm.attr('outer', 'outerValue2');
            can.batch.stop();
            ok(innerHTML(frag.firstChild).indexOf('OUTER2') >= 0, 'has OUTER2');
            ok(innerHTML(frag.firstChild).indexOf('INNER1') === -1, 'does not have INNER1');
        });
        test('Child bindings are called before the parent', function () {
            var template = '{{#eq page \'foo\'}}' + '{{#eq action \'view\'}} {{trace \'view foo\'}} {{/eq}}' + '{{#eq action \'edit\'}} {{trace \'edit foo\'}} {{/eq}}' + '{{/eq}}' + '{{#eq page \'bar\'}}' + '{{#eq action \'view\'}} {{trace \'view bar\'}} {{/eq}}' + '{{#eq action \'edit\'}} {{trace \'edit bar\'}} {{/eq}}' + '{{/eq}}';
            var state = new can.Map({
                action: 'view',
                page: 'foo'
            });
            var counter = 0;
            can.stache(template)(state, {
                trace: function (value, options) {
                    if (counter === 0) {
                        equal(value, 'view foo');
                    } else if (counter === 1) {
                        equal(value, 'edit bar');
                    } else {
                        ok(false, 'Traced an unexpected template call');
                    }
                    counter++;
                }
            });
            state.attr({
                action: 'edit',
                page: 'bar'
            });
            equal(counter, 2, 'Counter incremented twice');
        });
        test('%index is double wrapped compute in helper (#2179)', function () {
            var appState = new can.Map({
                todos: [
                    { description: 'Foo' },
                    { description: 'Bar' }
                ]
            });
            var template = can.stache('{{#each todos}}<div>{{indexPlusOne %index}}</div>{{/each}}');
            can.stache.registerHelper('indexPlusOne', function (val, options) {
                var resolved = val();
                equal(typeof resolved, 'number', 'should be a number');
                return resolved + 2;
            });
            template(appState);
        });
        test('%index is double wrapped compute in helper (#2179)', function () {
            var appState = new can.Map({
                todos: [
                    { description: 'Foo' },
                    { description: 'Bar' }
                ]
            });
            var template = can.stache('{{#each todos}}<div>{{indexPlusOne %index}}</div>{{/each}}');
            can.stache.registerHelper('indexPlusOne', function (val, options) {
                var resolved = val();
                equal(typeof resolved, 'number', 'should be a number');
                return resolved + 2;
            });
            template(appState);
        });
        test('content within {{#if}} inside partial surrounded by {{#if}} should not display outside partial (#2186)', function () {
            can.view.registerView('partial', '{{#showHiddenSection}}<div>Hidden</div>{{/showHiddenSection}}');
            var renderer = can.stache('<div>{{#showPartial}}{{>partial}}{{/showPartial}}</div>');
            var data = new can.Map({
                showPartial: true,
                showHiddenSection: false
            });
            var frag = renderer(data);
            data.attr('showHiddenSection', true);
            data.attr('showPartial', false);
            equal(innerHTML(frag.firstChild), '');
        });
        test('nested sections work (#2229)', function () {
            var template = can.stache('<div {{#a}}' + '{{#b}}f="f"' + '{{else}}' + '{{#c}}f="f"{{/c}}' + '{{/b}}' + '{{/a}}/>');
            var frag = template(new can.Map({
                a: true,
                b: false,
                c: true
            }));
            equal(frag.firstChild.getAttribute('f'), 'f', 'able to set f');
        });
    }
});
/*view/href/href_test*/
define('can/view/href/href_test', function (require, exports, module) {
    var can = require('can/util/util');
    require('can/route/route');
    require('can/test/test');
    require('steal-qunit');
    var makeIframe = function (src) {
        var iframe = document.createElement('iframe');
        window.removeMyself = function () {
            delete window.removeMyself;
            delete window.isReady;
            delete window.hasError;
            document.body.removeChild(iframe);
            start();
        };
        window.hasError = function (error) {
            ok(false, error.message);
            window.removeMyself();
        };
        window.isReady = function (el, viewModel, setPrettyUrl) {
            equal(el.find('a').attr('href'), '#!&page=recipe&id=5', 'should set unpretty href attribute');
            viewModel.recipe.attr('id', 7);
            equal(el.find('a').attr('href'), '#!&page=recipe&id=7', 'should update href');
            setPrettyUrl();
            viewModel.recipe.attr('id', 8);
            equal(el.find('a').attr('href'), '#!recipe/8', 'should set pretty href');
            viewModel.recipe.attr('id', 9);
            equal(el.find('a').attr('href'), '#!recipe/9', 'should update pretty href');
            window.removeMyself();
        };
        document.body.appendChild(iframe);
        iframe.src = src;
    };
    QUnit.module('can/view/href');
    if (window.steal) {
        asyncTest('the basics are able to work for steal', function () {
            makeIframe(can.test.path('view/href/tests/basics.html?' + Math.random()));
        });
    }
});
/*control/control_test*/
define('can/control/control_test', function (require, exports, module) {
    require('can/control/control');
    require('steal-qunit');
    QUnit.module('can/control');
    var isOpera = /Opera/.test(navigator.userAgent), isDojo = typeof dojo !== 'undefined';
    if (!(isOpera && isDojo)) {
        test('basics', 14, function () {
            var clickCount = 0;
            var Things = can.Control({
                'click': function () {
                    clickCount++;
                },
                'span  click': function () {
                    ok(true, 'SPAN clicked');
                },
                '{foo} bar': function () {
                }
            });
            var foo = {
                bind: function (event, cb) {
                    ok(true, 'bind called');
                    equal(event, 'bar', 'bind given bar');
                    ok(cb, 'called with a callback');
                },
                unbind: function (event, cb) {
                    ok(true, 'unbind called');
                    equal(event, 'bar', 'unbind given bar');
                    ok(cb, 'called with a callback');
                }
            };
            can.append(can.$('#qunit-fixture'), '<div id=\'things\'>div<span>span</span></div>');
            var things = new Things('#things', { foo: foo });
            can.trigger(can.$('#things span'), 'click');
            can.trigger(can.$('#things'), 'click');
            equal(clickCount, 2, 'click called twice');
            things.destroy();
            can.trigger(can.$('#things span'), 'click');
            new Things('#things', { foo: foo });
            can.remove(can.$('#things'));
        });
    }
    test('data', function () {
        var Things = can.Control({});
        can.append(can.$('#qunit-fixture'), '<div id=\'things\'>div<span>span</span></div>');
        new Things('#things', {});
        new Things('#things', {});
        equal(can.data(can.$('#things'), 'controls').length, 2, 'there are 2 items in the data array');
        can.remove(can.$('#things'));
    });
    if (window.jQuery) {
        test('bind to any special', function () {
            window.jQuery.event.special.crazyEvent = {};
            var called = false;
            can.Control('WeirdBind', {
                crazyEvent: function () {
                    called = true;
                }
            });
            var a = $('<div id=\'crazy\'></div>').appendTo($('#qunit-fixture'));
            new WeirdBind(a);
            a.trigger('crazyEvent');
            ok(called, 'heard the trigger');
            $('#qunit-fixture').html('');
        });
    }
    test('parameterized actions', function () {
        if (can.Y) {
            can.Y.mix(can.Y.Node.DOM_EVENTS, { sillyEvent: true });
        }
        var called = false, WeirderBind = can.Control({
                '{parameterized}': function () {
                    called = true;
                }
            }), a;
        can.append(can.$('#qunit-fixture'), '<div id=\'crazy\'></div>');
        a = can.$('#crazy');
        new WeirderBind(a, { parameterized: 'sillyEvent' });
        can.trigger(a, 'sillyEvent');
        ok(called, 'heard the trigger');
        can.remove(a);
    });
    test('windowresize', function () {
        var called = false, WindowBind = can.Control('', {
                '{window} resize': function () {
                    called = true;
                }
            });
        can.append(can.$('#qunit-fixture'), '<div id=\'weird\'>');
        new WindowBind('#weird');
        can.trigger(can.$(window), 'resize');
        ok(called, 'got window resize event');
        can.remove(can.$('#weird'));
    });
    if (!(isOpera && isDojo)) {
        test('on', function () {
            var called = false, DelegateTest = can.Control({
                    click: function () {
                    }
                }), Tester = can.Control({
                    init: function (el, ops) {
                        this.on(window, 'click', function (ev) {
                            ok(true, 'Got window click event');
                        });
                        this.on(window, 'click', 'clicked');
                        this.on('click', function () {
                            ok(true, 'Directly clicked element');
                        });
                        this.on('click', 'clicked');
                    },
                    clicked: function () {
                        ok(true, 'Controller action delegated click triggered, too');
                    }
                }), div = document.createElement('div');
            can.append(can.$('#qunit-fixture'), div);
            var rb = new Tester(div);
            can.append(can.$('#qunit-fixture'), '<div id=\'els\'><span id=\'elspan\'><a href=\'javascript://\' id=\'elsa\'>click me</a></span></div>');
            var els = can.$('#els');
            var dt = new DelegateTest(els);
            dt.on(can.$('#els span'), 'a', 'click', function () {
                called = true;
            });
            can.trigger(can.$('#els a'), 'click');
            ok(called, 'delegate works');
            can.remove(els);
            can.trigger(can.$(div), 'click');
            can.trigger(window, 'click');
            rb.destroy();
        });
    }
    test('inherit', function () {
        var called = false, Parent = can.Control({
                click: function () {
                    called = true;
                }
            }), Child = Parent({});
        can.append(can.$('#qunit-fixture'), '<div id=\'els\'><span id=\'elspan\'><a href=\'#\' id=\'elsa\'>click me</a></span></div>');
        var els = can.$('#els');
        new Child(els);
        can.trigger(can.$('#els'), 'click');
        ok(called, 'inherited the click method');
        can.remove(els);
    });
    test('space makes event', 1, function () {
        if (can.Y) {
            can.Y.mix(can.Y.Node.DOM_EVENTS, { foo: true });
        }
        var Dot = can.Control({
            ' foo': function () {
                ok(true, 'called');
            }
        });
        can.append(can.$('#qunit-fixture'), '<div id=\'els\'><span id=\'elspan\'><a href=\'#\' id=\'elsa\'>click me</a></span></div>');
        var els = can.$('#els');
        new Dot(els);
        can.trigger(can.$('#els'), 'foo');
        can.remove(els);
    });
    test('custom events with hyphens work', 1, function () {
        can.append(can.$('#qunit-fixture'), '<div id=\'customEvent\'><span></span></div>');
        var FooBar = can.Control({
            'span custom-event': function () {
                ok(true, 'Custom event was fired.');
            }
        });
        new FooBar('#customEvent');
        can.trigger(can.$('#customEvent span'), 'custom-event');
    });
    test('inherit defaults', function () {
        var BASE = can.Control({ defaults: { foo: 'bar' } }, {});
        var INHERIT = BASE({ defaults: { newProp: 'newVal' } }, {});
        ok(INHERIT.defaults.foo === 'bar', 'Class must inherit defaults from the parent class');
        ok(INHERIT.defaults.newProp === 'newVal', 'Class must have own defaults');
        var inst = new INHERIT(document.createElement('div'), {});
        ok(inst.options.foo === 'bar', 'Instance must inherit defaults from the parent class');
        ok(inst.options.newProp === 'newVal', 'Instance must have defaults of it`s class');
    });
    var bindable = function (b) {
        if (window.jQuery) {
            return b;
        } else {
        }
        return b;
    };
    test('on rebinding', 2, function () {
        var first = true;
        var Rebinder = can.Control({
            '{item} foo': function (item, ev) {
                if (first) {
                    equal(item.id, 1, 'first item');
                    first = false;
                } else {
                    equal(item.id, 2, 'first item');
                }
            }
        });
        var item1 = bindable({ id: 1 }), item2 = bindable({ id: 2 }), rb = new Rebinder(document.createElement('div'), { item: item1 });
        can.trigger(item1, 'foo');
        rb.options = { item: item2 };
        rb.on();
        can.trigger(item2, 'foo');
    });
    test('actions provide method names', function () {
        var Tester = can.Control({
            '{item1} foo': 'food',
            '{item2} bar': 'food',
            food: function (item, ev, data) {
                ok(true, 'food called');
                ok(item === item1 || item === item2, 'called with an item');
            }
        });
        var item1 = {}, item2 = {};
        new Tester(document.createElement('div'), {
            item1: item1,
            item2: item2
        });
        can.trigger(item1, 'foo');
        can.trigger(item2, 'bar');
    });
    test('Don\'t bind if there are undefined values in templates', function () {
        can.Control.processors.proc = function () {
            ok(false, 'This processor should never be called');
        };
        var Control = can.Control({}, {
            '{noExistStuff} proc': function () {
            }
        });
        var c = new Control(document.createElement('div'));
        equal(c._bindings.user.length, 1, 'There is only one binding');
    });
    test('Multiple calls to destroy', 2, function () {
        var Control = can.Control({
                destroy: function () {
                    ok(true);
                    can.Control.prototype.destroy.call(this);
                }
            }), div = document.createElement('div'), c = new Control(div);
        c.destroy();
        c.destroy();
    });
    test('drag and drop events', function () {
        expect(7);
        var DragDrop = can.Control('', {
            ' dragstart': function () {
                ok(true, 'dragstart called');
            },
            ' dragenter': function () {
                ok(true, 'dragenter called');
            },
            ' dragover': function () {
                ok(true, 'dragover called');
            },
            ' dragleave': function () {
                ok(true, 'dragleave called');
            },
            ' drag': function () {
                ok(true, 'drag called');
            },
            ' drop': function () {
                ok(true, 'drop called');
            },
            ' dragend': function () {
                ok(true, 'dragend called');
            }
        });
        can.append(can.$('#qunit-fixture'), '<div id="draggable"/>');
        new DragDrop('#draggable');
        can.trigger(can.$('#draggable'), 'dragstart');
        can.trigger(can.$('#draggable'), 'dragenter');
        can.trigger(can.$('#draggable'), 'dragover');
        can.trigger(can.$('#draggable'), 'dragleave');
        can.trigger(can.$('#draggable'), 'drag');
        can.trigger(can.$('#draggable'), 'drop');
        can.trigger(can.$('#draggable'), 'dragend');
        can.remove(can.$('#draggable'));
    });
    if (can.dev) {
        test('Control is logging information in dev mode', function () {
            expect(2);
            var oldlog = can.dev.log;
            var oldwarn = can.dev.warn;
            can.dev.log = function (text) {
                equal(text, 'can/control/control.js: No property found for handling {dummy} change', 'Text logged as expected');
            };
            var Control = can.Control({
                '{dummy} change': function () {
                }
            });
            var instance = new Control(document.createElement('div'));
            can.dev.warn = function (text) {
                equal(text, 'can/control/control.js: Control already destroyed');
            };
            instance.destroy();
            instance.destroy();
            can.dev.warn = oldwarn;
            can.dev.log = oldlog;
        });
    }
});
/*route/route_test*/
define('can/route/route_test', function (require, exports, module) {
    var can = require('can/util/util');
    require('can/route/route');
    require('can/map/define/define');
    require('can/test/test');
    require('steal-qunit');
    QUnit.module('can/route', {
        setup: function () {
            can.route._teardown();
            can.route.defaultBinding = 'hashchange';
        }
    });
    if ('onhashchange' in window) {
        test('deparam', function () {
            can.route.routes = {};
            can.route(':page', { page: 'index' });
            var obj = can.route.deparam('can.Control');
            deepEqual(obj, {
                page: 'can.Control',
                route: ':page'
            });
            obj = can.route.deparam('');
            deepEqual(obj, {
                page: 'index',
                route: ':page'
            });
            obj = can.route.deparam('can.Control&where=there');
            deepEqual(obj, {
                page: 'can.Control',
                where: 'there',
                route: ':page'
            });
            can.route.routes = {};
            can.route(':page/:index', {
                page: 'index',
                index: 'foo'
            });
            obj = can.route.deparam('can.Control/&where=there');
            deepEqual(obj, {
                page: 'can.Control',
                index: 'foo',
                where: 'there',
                route: ':page/:index'
            }, 'default value and queryparams');
        });
        test('deparam of invalid url', function () {
            var obj;
            can.route.routes = {};
            can.route('pages/:var1/:var2/:var3', {
                var1: 'default1',
                var2: 'default2',
                var3: 'default3'
            });
            obj = can.route.deparam('pages//');
            deepEqual(obj, {});
            obj = can.route.deparam('pages/val1/val2/val3&invalid-parameters');
            deepEqual(obj, {
                var1: 'val1',
                var2: 'val2',
                var3: 'val3',
                route: 'pages/:var1/:var2/:var3'
            });
        });
        test('deparam of url with non-generated hash (manual override)', function () {
            var obj;
            can.route.routes = {};
            obj = can.route.deparam('page=foo&bar=baz&where=there');
            deepEqual(obj, {
                page: 'foo',
                bar: 'baz',
                where: 'there'
            });
        });
        test('param', function () {
            can.route.routes = {};
            can.route('pages/:page', { page: 'index' });
            var res = can.route.param({ page: 'foo' });
            equal(res, 'pages/foo');
            res = can.route.param({
                page: 'foo',
                index: 'bar'
            });
            equal(res, 'pages/foo&index=bar');
            can.route('pages/:page/:foo', {
                page: 'index',
                foo: 'bar'
            });
            res = can.route.param({
                page: 'foo',
                foo: 'bar',
                where: 'there'
            });
            equal(res, 'pages/foo/&where=there');
            res = can.route.param({});
            equal(res, '');
            can.route.routes = {};
            res = can.route.param({
                page: 'foo',
                bar: 'baz',
                where: 'there'
            });
            equal(res, '&page=foo&bar=baz&where=there');
            res = can.route.param({});
            equal(res, '');
        });
        test('symmetry', function () {
            can.route.routes = {};
            var obj = {
                page: '=&[]',
                nestedArray: ['a'],
                nested: { a: 'b' }
            };
            var res = can.route.param(obj);
            var o2 = can.route.deparam(res);
            deepEqual(o2, obj);
        });
        test('light param', function () {
            can.route.routes = {};
            can.route(':page', { page: 'index' });
            var res = can.route.param({ page: 'index' });
            equal(res, '');
            can.route('pages/:p1/:p2/:p3', {
                p1: 'index',
                p2: 'foo',
                p3: 'bar'
            });
            res = can.route.param({
                p1: 'index',
                p2: 'foo',
                p3: 'bar'
            });
            equal(res, 'pages///');
            res = can.route.param({
                p1: 'index',
                p2: 'baz',
                p3: 'bar'
            });
            equal(res, 'pages//baz/');
        });
        test('param doesnt add defaults to params', function () {
            can.route.routes = {};
            can.route('pages/:p1', { p2: 'foo' });
            var res = can.route.param({
                p1: 'index',
                p2: 'foo'
            });
            equal(res, 'pages/index');
        });
        test('param-deparam', function () {
            can.route(':page/:type', {
                page: 'index',
                type: 'foo'
            });
            var data = {
                page: 'can.Control',
                type: 'document',
                bar: 'baz',
                where: 'there'
            };
            var res = can.route.param(data);
            var obj = can.route.deparam(res);
            delete obj.route;
            deepEqual(obj, data);
            data = {
                page: 'can.Control',
                type: 'foo',
                bar: 'baz',
                where: 'there'
            };
            res = can.route.param(data);
            obj = can.route.deparam(res);
            delete obj.route;
            deepEqual(data, obj);
            data = {
                page: ' a ',
                type: ' / '
            };
            res = can.route.param(data);
            obj = can.route.deparam(res);
            delete obj.route;
            deepEqual(obj, data, 'slashes and spaces');
            data = {
                page: 'index',
                type: 'foo',
                bar: 'baz',
                where: 'there'
            };
            res = can.route.param(data);
            obj = can.route.deparam(res);
            delete obj.route;
            deepEqual(data, obj);
            can.route.routes = {};
            data = {
                page: 'foo',
                bar: 'baz',
                where: 'there'
            };
            res = can.route.param(data);
            obj = can.route.deparam(res);
            deepEqual(data, obj);
        });
        test('deparam-param', function () {
            can.route.routes = {};
            can.route(':foo/:bar', {
                foo: 1,
                bar: 2
            });
            var res = can.route.param({
                foo: 1,
                bar: 2
            });
            equal(res, '/', 'empty slash');
            var deparamed = can.route.deparam('/');
            deepEqual(deparamed, {
                foo: 1,
                bar: 2,
                route: ':foo/:bar'
            });
        });
        test('precident', function () {
            can.route.routes = {};
            can.route(':who', { who: 'index' });
            can.route('search/:search');
            var obj = can.route.deparam('can.Control');
            deepEqual(obj, {
                who: 'can.Control',
                route: ':who'
            });
            obj = can.route.deparam('search/can.Control');
            deepEqual(obj, {
                search: 'can.Control',
                route: 'search/:search'
            }, 'bad deparam');
            equal(can.route.param({ search: 'can.Control' }), 'search/can.Control', 'bad param');
            equal(can.route.param({ who: 'can.Control' }), 'can.Control');
        });
        test('better matching precident', function () {
            can.route.routes = {};
            can.route(':type', { who: 'index' });
            can.route(':type/:id');
            equal(can.route.param({
                type: 'foo',
                id: 'bar'
            }), 'foo/bar');
        });
        test('linkTo', function () {
            can.route.routes = {};
            can.route(':foo');
            var res = can.route.link('Hello', {
                foo: 'bar',
                baz: 'foo'
            });
            equal(res, '<a href="#!bar&baz=foo">Hello</a>');
        });
        test('param with route defined', function () {
            can.route.routes = {};
            can.route('holler');
            can.route('foo');
            var res = can.route.param({
                foo: 'abc',
                route: 'foo'
            });
            equal(res, 'foo&foo=abc');
        });
        test('route endings', function () {
            can.route.routes = {};
            can.route('foo', { foo: true });
            can.route('food', { food: true });
            var res = can.route.deparam('food');
            ok(res.food, 'we get food back');
        });
        test('strange characters', function () {
            can.route.routes = {};
            can.route(':type/:id');
            var res = can.route.deparam('foo/' + encodeURIComponent('/'));
            equal(res.id, '/');
            res = can.route.param({
                type: 'bar',
                id: '/'
            });
            equal(res, 'bar/' + encodeURIComponent('/'));
        });
        test('empty default is matched even if last', function () {
            can.route.routes = {};
            can.route(':who');
            can.route('', { foo: 'bar' });
            var obj = can.route.deparam('');
            deepEqual(obj, {
                foo: 'bar',
                route: ''
            });
        });
        test('order matched', function () {
            can.route.routes = {};
            can.route(':foo');
            can.route(':bar');
            var obj = can.route.deparam('abc');
            deepEqual(obj, {
                foo: 'abc',
                route: ':foo'
            });
        });
        test('param order matching', function () {
            can.route.routes = {};
            can.route('', { bar: 'foo' });
            can.route('something/:bar');
            var res = can.route.param({ bar: 'foo' });
            equal(res, '', 'picks the shortest, best match');
            can.route.routes = {};
            can.route(':recipe', {
                recipe: 'recipe1',
                task: 'task3'
            });
            can.route(':recipe/:task', {
                recipe: 'recipe1',
                task: 'task3'
            });
            res = can.route.param({
                recipe: 'recipe1',
                task: 'task3'
            });
            equal(res, '', 'picks the first match of everything');
            res = can.route.param({
                recipe: 'recipe1',
                task: 'task2'
            });
            equal(res, '/task2');
        });
        test('dashes in routes', function () {
            can.route.routes = {};
            can.route(':foo-:bar');
            var obj = can.route.deparam('abc-def');
            deepEqual(obj, {
                foo: 'abc',
                bar: 'def',
                route: ':foo-:bar'
            });
            window.location.hash = 'qunit-fixture';
            window.location.hash = '';
        });
        var teardownRouteTest;
        var setupRouteTest = function (callback) {
            var testarea = document.getElementById('qunit-fixture');
            var iframe = document.createElement('iframe');
            stop();
            window.routeTestReady = function () {
                var args = can.makeArray(arguments);
                args.unshift(iframe);
                callback.apply(null, args);
            };
            iframe.src = can.test.path('route/testing.html?' + Math.random());
            testarea.appendChild(iframe);
            teardownRouteTest = function () {
                setTimeout(function () {
                    can.remove(can.$(iframe));
                    setTimeout(function () {
                        start();
                    }, 10);
                }, 1);
            };
        };
        if (typeof steal !== 'undefined') {
            test('listening to hashchange (#216, #124)', function () {
                setupRouteTest(function (iframe, iCanRoute) {
                    ok(!iCanRoute.attr('bla'), 'Value not set yet');
                    iCanRoute.bind('change', function () {
                        equal(iCanRoute.attr('bla'), 'blu', 'Got route change event and value is as expected');
                        teardownRouteTest();
                    });
                    iCanRoute.ready();
                    setTimeout(function () {
                        iframe.src = iframe.src + '#!bla=blu';
                    }, 10);
                });
            });
            test('initial route fires twice', function () {
                stop();
                expect(1);
                window.routeTestReady = function (iCanRoute, loc) {
                    iCanRoute('', {});
                    iCanRoute.bind('change', function () {
                        ok(true, 'change triggered once');
                        start();
                    });
                    iCanRoute.ready();
                };
                var iframe = document.createElement('iframe');
                iframe.src = can.test.path('route/testing.html?5');
                can.$('#qunit-fixture')[0].appendChild(iframe);
            });
            test('removing things from the hash', function () {
                setupRouteTest(function (iframe, iCanRoute, loc) {
                    iCanRoute.bind('change', function () {
                        equal(iCanRoute.attr('foo'), 'bar', 'expected value');
                        iCanRoute.unbind('change');
                        iCanRoute.bind('change', function () {
                            equal(iCanRoute.attr('personId'), '3', 'personId');
                            equal(iCanRoute.attr('foo'), undefined, 'unexpected value');
                            iCanRoute.unbind('change');
                            teardownRouteTest();
                        });
                        setTimeout(function () {
                            iframe.contentWindow.location.hash = '#!personId=3';
                        }, 100);
                    });
                    iCanRoute.ready();
                    setTimeout(function () {
                        iframe.contentWindow.location.hash = '#!foo=bar';
                    }, 100);
                });
            });
            test('can.route.map: conflicting route values, hash should win', function () {
                setupRouteTest(function (iframe, iCanRoute, loc) {
                    iCanRoute(':type/:id');
                    var AppState = can.Map.extend();
                    var appState = new AppState({
                        type: 'dog',
                        id: '4'
                    });
                    iCanRoute.map(appState);
                    loc.hash = '#!cat/5';
                    iCanRoute.ready();
                    setTimeout(function () {
                        var after = loc.href.substr(loc.href.indexOf('#'));
                        equal(after, '#!cat/5', 'same URL');
                        equal(appState.attr('type'), 'cat', 'conflicts should be won by the URL');
                        equal(appState.attr('id'), '5', 'conflicts should be won by the URL');
                        teardownRouteTest();
                    }, 30);
                });
            });
            test('can.route.map: route is initialized from URL first, then URL params are added from can.route.data', function () {
                setupRouteTest(function (iframe, iCanRoute, loc) {
                    iCanRoute(':type/:id');
                    var AppState = can.Map.extend();
                    var appState = new AppState({ section: 'home' });
                    iCanRoute.map(appState);
                    loc.hash = '#!cat/5';
                    iCanRoute.ready();
                    setTimeout(function () {
                        var after = loc.href.substr(loc.href.indexOf('#'));
                        equal(after, '#!cat/5&section=home', 'same URL');
                        equal(appState.attr('type'), 'cat', 'hash populates the appState');
                        equal(appState.attr('id'), '5', 'hash populates the appState');
                        equal(appState.attr('section'), 'home', 'appState keeps its properties');
                        ok(iCanRoute.data === appState, 'can.route.data is the same as appState');
                        teardownRouteTest();
                    }, 30);
                });
            });
            test('updating the hash', function () {
                setupRouteTest(function (iframe, iCanRoute, loc) {
                    iCanRoute.ready();
                    iCanRoute(':type/:id');
                    iCanRoute.attr({
                        type: 'bar',
                        id: '/'
                    });
                    setTimeout(function () {
                        var after = loc.href.substr(loc.href.indexOf('#'));
                        equal(after, '#!bar/' + encodeURIComponent('/'));
                        teardownRouteTest();
                    }, 30);
                });
            });
            test('sticky enough routes', function () {
                setupRouteTest(function (iframe, iCanRoute, loc) {
                    iCanRoute.ready();
                    iCanRoute('active');
                    iCanRoute('');
                    loc.hash = '#!active';
                    setTimeout(function () {
                        var after = loc.href.substr(loc.href.indexOf('#'));
                        equal(after, '#!active');
                        teardownRouteTest();
                    }, 30);
                });
            });
            test('unsticky routes', function () {
                setupRouteTest(function (iframe, iCanRoute, loc) {
                    iCanRoute.ready();
                    iCanRoute(':type');
                    iCanRoute(':type/:id');
                    iCanRoute.attr({ type: 'bar' });
                    setTimeout(function () {
                        var after = loc.href.substr(loc.href.indexOf('#'));
                        equal(after, '#!bar');
                        iCanRoute.attr({
                            type: 'bar',
                            id: '/'
                        });
                        var time = new Date();
                        setTimeout(function innerTimer() {
                            var after = loc.href.substr(loc.href.indexOf('#'));
                            if (after === '#!bar/' + encodeURIComponent('/')) {
                                equal(after, '#!bar/' + encodeURIComponent('/'), 'should go to type/id');
                                teardownRouteTest();
                            } else if (new Date() - time > 2000) {
                                ok(false, 'hash is ' + after);
                                can.remove(can.$(iframe));
                            } else {
                                setTimeout(innerTimer, 30);
                            }
                        }, 100);
                    }, 100);
                });
            });
            test('can.route.current is live-bindable (#1156)', function () {
                setupRouteTest(function (iframe, iCanRoute, loc, win) {
                    iCanRoute.ready();
                    var isOnTestPage = win.can.compute(function () {
                        return iCanRoute.current({ page: 'test' });
                    });
                    isOnTestPage.bind('change', function (ev, newVal) {
                        teardownRouteTest();
                    });
                    equal(isOnTestPage(), false, 'initially not on test page');
                    setTimeout(function () {
                        iCanRoute.attr('page', 'test');
                    }, 20);
                });
            });
            test('can.compute.read should not call can.route (#1154)', function () {
                setupRouteTest(function (iframe, iCanRoute, loc, win) {
                    iCanRoute.attr('page', 'test');
                    iCanRoute.ready();
                    var val = win.can.compute.read({ route: iCanRoute }, win.can.compute.read.reads('route')).value;
                    setTimeout(function () {
                        equal(val, iCanRoute, 'read correctly');
                        teardownRouteTest();
                    }, 1);
                });
            });
            test('routes should deep clean', function () {
                expect(2);
                setupRouteTest(function (iframe, iCanRoute, loc) {
                    iCanRoute.ready();
                    var hash1 = can.route.url({
                        panelA: {
                            name: 'fruit',
                            id: 15,
                            show: true
                        }
                    });
                    var hash2 = can.route.url({
                        panelA: {
                            name: 'fruit',
                            id: 20,
                            read: false
                        }
                    });
                    loc.hash = hash1;
                    loc.hash = hash2;
                    setTimeout(function () {
                        equal(iCanRoute.attr('panelA.id'), 20, 'id should change');
                        equal(iCanRoute.attr('panelA.show'), undefined, 'show should be removed');
                        teardownRouteTest();
                    }, 30);
                });
            });
            test('updating bound can.Map causes single update with a coerced string value', function () {
                expect(1);
                setupRouteTest(function (iframe, route) {
                    var appVM = new can.Map();
                    route.map(appVM);
                    route.ready();
                    appVM.bind('action', function (ev, newVal) {
                        strictEqual(newVal, '10');
                    });
                    appVM.attr('action', 10);
                    setTimeout(function () {
                        teardownRouteTest();
                    }, 5);
                });
            });
            test('updating unserialized prop on bound can.Map causes single update without a coerced string value', function () {
                expect(1);
                setupRouteTest(function (iframe, route) {
                    var appVM = new (can.Map.extend({ define: { action: { serialize: false } } }))();
                    route.map(appVM);
                    route.ready();
                    appVM.bind('action', function (ev, newVal) {
                        equal(typeof newVal, 'function');
                    });
                    appVM.attr('action', function () {
                    });
                    setTimeout(function () {
                        teardownRouteTest();
                    }, 5);
                });
            });
            test('hash doesn\'t update to itself with a !', function () {
                stop();
                window.routeTestReady = function (iCanRoute, loc) {
                    iCanRoute.ready();
                    iCanRoute(':path');
                    iCanRoute.attr('path', 'foo');
                    setTimeout(function () {
                        var counter = 0;
                        try {
                            equal(loc.hash, '#!foo');
                        } catch (e) {
                            start();
                            throw e;
                        }
                        iCanRoute.bind('change', function () {
                            counter++;
                        });
                        loc.hash = 'bar';
                        setTimeout(function () {
                            try {
                                equal(loc.hash, '#bar');
                                equal(counter, 1);
                            } finally {
                                start();
                            }
                        }, 100);
                    }, 100);
                };
                var iframe = document.createElement('iframe');
                iframe.src = can.test.path('route/testing.html?1');
                can.$('#qunit-fixture')[0].appendChild(iframe);
            });
        }
        test('escaping periods', function () {
            can.route.routes = {};
            can.route(':page\\.html', { page: 'index' });
            var obj = can.route.deparam('can.Control.html');
            deepEqual(obj, {
                page: 'can.Control',
                route: ':page\\.html'
            });
            equal(can.route.param({ page: 'can.Control' }), 'can.Control.html');
        });
        if (typeof require === 'undefined') {
            test('correct stringing', function () {
                setupRouteTest(function (iframe, route) {
                    route.routes = {};
                    route.attr('number', 1);
                    propEqual(route.attr(), { 'number': '1' });
                    route.attr({ bool: true }, true);
                    propEqual(route.attr(), { 'bool': 'true' });
                    route.attr({ string: 'hello' }, true);
                    propEqual(route.attr(), { 'string': 'hello' });
                    route.attr({
                        array: [
                            1,
                            true,
                            'hello'
                        ]
                    }, true);
                    propEqual(route.attr(), {
                        'array': [
                            '1',
                            'true',
                            'hello'
                        ]
                    });
                    route.attr({
                        number: 1,
                        bool: true,
                        string: 'hello',
                        array: [
                            2,
                            false,
                            'world'
                        ],
                        obj: {
                            number: 3,
                            array: [
                                4,
                                true
                            ]
                        }
                    }, true);
                    propEqual(route.attr(), {
                        number: '1',
                        bool: 'true',
                        string: 'hello',
                        array: [
                            '2',
                            'false',
                            'world'
                        ],
                        obj: {
                            number: '3',
                            array: [
                                '4',
                                'true'
                            ]
                        }
                    });
                    route.routes = {};
                    route(':type/:id');
                    route.attr({
                        type: 'page',
                        id: 10,
                        sort_by_name: true
                    }, true);
                    propEqual(route.attr(), {
                        type: 'page',
                        id: '10',
                        sort_by_name: 'true'
                    });
                    teardownRouteTest();
                });
            });
        }
        test('on/off binding', function () {
            can.route.routes = {};
            expect(1);
            can.route.on('foo', function () {
                ok(true, 'foo called');
                can.route.off('foo');
                can.route.attr('foo', 'baz');
            });
            can.route.attr('foo', 'bar');
        });
        test('two way binding can.route.map with can.Map instance', function () {
            expect(1);
            var AppState = can.Map.extend();
            var appState = new AppState();
            can.route.map(appState);
            can.route.on('change', function () {
                equal(can.route.attr('name'), 'Brian', 'appState is bound to can.route');
                can.route.off('change');
                appState.removeAttr('name');
            });
            appState.attr('name', 'Brian');
        });
    }
});
/*route/pushstate/pushstate_test*/
define('can/route/pushstate/pushstate_test', function (require, exports, module) {
    var can = require('can/util/util');
    require('can/route/route');
    require('can/route/pushstate/pushstate');
    require('can/test/test');
    require('steal-qunit');
    function eventFire(el, etype) {
        var doc = el.ownerDocument, win = doc.defaultView || doc.parentWindow;
        win.can.trigger(el, etype, [], true);
    }
    if (window.history && history.pushState) {
        QUnit.module('can/route/pushstate', {
            setup: function () {
                can.route._teardown();
                can.route.defaultBinding = 'pushstate';
            },
            teardown: function () {
            }
        });
        test('deparam', function () {
            can.route.routes = {};
            can.route(':page', { page: 'index' });
            var obj = can.route.deparam('can.Control');
            deepEqual(obj, {
                page: 'can.Control',
                route: ':page'
            });
            obj = can.route.deparam('');
            deepEqual(obj, {
                page: 'index',
                route: ':page'
            });
            obj = can.route.deparam('can.Control?where=there');
            deepEqual(obj, {
                page: 'can.Control',
                where: 'there',
                route: ':page'
            });
            can.route.routes = {};
            can.route(':page/:index', {
                page: 'index',
                index: 'foo'
            });
            obj = can.route.deparam('can.Control/?where=there');
            deepEqual(obj, {
                page: 'can.Control',
                index: 'foo',
                where: 'there',
                route: ':page/:index'
            });
        });
        test('deparam of invalid url', function () {
            var obj;
            can.route.routes = {};
            can.route('pages/:var1/:var2/:var3', {
                var1: 'default1',
                var2: 'default2',
                var3: 'default3'
            });
            obj = can.route.deparam('pages//');
            deepEqual(obj, {});
            obj = can.route.deparam('pages/val1/val2/val3?invalid-parameters');
            deepEqual(obj, {
                var1: 'val1',
                var2: 'val2',
                var3: 'val3',
                route: 'pages/:var1/:var2/:var3'
            });
        });
        test('deparam of url with non-generated hash (manual override)', function () {
            var obj;
            can.route.routes = {};
            obj = can.route.deparam('?page=foo&bar=baz&where=there');
            deepEqual(obj, {
                page: 'foo',
                bar: 'baz',
                where: 'there'
            });
        });
        test('param', function () {
            can.route.routes = {};
            can.route('pages/:page', { page: 'index' });
            var res = can.route.param({ page: 'foo' });
            equal(res, 'pages/foo');
            res = can.route.param({
                page: 'foo',
                index: 'bar'
            });
            equal(res, 'pages/foo?index=bar');
            can.route('pages/:page/:foo', {
                page: 'index',
                foo: 'bar'
            });
            res = can.route.param({
                page: 'foo',
                foo: 'bar',
                where: 'there'
            });
            equal(res, 'pages/foo/?where=there');
            res = can.route.param({});
            equal(res, '');
            can.route.routes = {};
            res = can.route.param({
                page: 'foo',
                bar: 'baz',
                where: 'there'
            });
            equal(res, '?page=foo&bar=baz&where=there');
            res = can.route.param({});
            equal(res, '');
        });
        test('symmetry', function () {
            can.route.routes = {};
            var obj = {
                page: '=&[]',
                nestedArray: ['a'],
                nested: { a: 'b' }
            };
            var res = can.route.param(obj);
            var o2 = can.route.deparam(res);
            deepEqual(o2, obj);
        });
        test('light param', function () {
            can.route.routes = {};
            can.route(':page', { page: 'index' });
            var res = can.route.param({ page: 'index' });
            equal(res, '');
            can.route('pages/:p1/:p2/:p3', {
                p1: 'index',
                p2: 'foo',
                p3: 'bar'
            });
            res = can.route.param({
                p1: 'index',
                p2: 'foo',
                p3: 'bar'
            });
            equal(res, 'pages///');
            res = can.route.param({
                p1: 'index',
                p2: 'baz',
                p3: 'bar'
            });
            equal(res, 'pages//baz/');
        });
        test('param doesnt add defaults to params', function () {
            can.route.routes = {};
            can.route('pages/:p1', { p2: 'foo' });
            var res = can.route.param({
                p1: 'index',
                p2: 'foo'
            });
            equal(res, 'pages/index');
        });
        test('param-deparam', function () {
            can.route(':page/:type', {
                page: 'index',
                type: 'foo'
            });
            var data = {
                page: 'can.Control',
                type: 'document',
                bar: 'baz',
                where: 'there'
            };
            var res = can.route.param(data);
            var obj = can.route.deparam(res);
            delete obj.route;
            deepEqual(obj, data);
            data = {
                page: 'can.Control',
                type: 'foo',
                bar: 'baz',
                where: 'there'
            };
            res = can.route.param(data);
            obj = can.route.deparam(res);
            delete obj.route;
            deepEqual(data, obj);
            data = {
                page: ' a ',
                type: ' / '
            };
            res = can.route.param(data);
            obj = can.route.deparam(res);
            delete obj.route;
            deepEqual(obj, data, 'slashes and spaces');
            data = {
                page: 'index',
                type: 'foo',
                bar: 'baz',
                where: 'there'
            };
            res = '/' + can.route.param(data);
            obj = can.route.deparam(res);
            delete obj.route;
            deepEqual(data, obj);
            can.route.routes = {};
            data = {
                page: 'foo',
                bar: 'baz',
                where: 'there'
            };
            res = can.route.param(data);
            obj = can.route.deparam(res);
            deepEqual(data, obj);
        });
        test('deparam-param', function () {
            can.route.routes = {};
            can.route(':foo/:bar', {
                foo: 1,
                bar: 2
            });
            var res = can.route.param({
                foo: 1,
                bar: 2
            });
            equal(res, '/', 'empty slash');
            var deparamed = can.route.deparam('//');
            deepEqual(deparamed, {
                foo: 1,
                bar: 2,
                route: ':foo/:bar'
            });
        });
        test('precident', function () {
            can.route.routes = {};
            can.route(':who', { who: 'index' });
            can.route('search/:search');
            var obj = can.route.deparam('can.Control');
            deepEqual(obj, {
                who: 'can.Control',
                route: ':who'
            });
            obj = can.route.deparam('search/can.Control');
            deepEqual(obj, {
                search: 'can.Control',
                route: 'search/:search'
            }, 'bad deparam');
            equal(can.route.param({ search: 'can.Control' }), 'search/can.Control', 'bad param');
            equal(can.route.param({ who: 'can.Control' }), 'can.Control');
        });
        test('better matching precident', function () {
            can.route.routes = {};
            can.route(':type', { who: 'index' });
            can.route(':type/:id');
            equal(can.route.param({
                type: 'foo',
                id: 'bar'
            }), 'foo/bar');
        });
        test('linkTo', function () {
            can.route.routes = {};
            can.route('/:foo');
            var res = can.route.link('Hello', {
                foo: 'bar',
                baz: 'foo'
            });
            equal(res, '<a href="/bar?baz=foo">Hello</a>');
        });
        test('param with route defined', function () {
            can.route.routes = {};
            can.route('holler');
            can.route('foo');
            var res = can.route.param({
                foo: 'abc',
                route: 'foo'
            });
            equal(res, 'foo?foo=abc');
        });
        test('route endings', function () {
            can.route.routes = {};
            can.route('foo', { foo: true });
            can.route('food', { food: true });
            var res = can.route.deparam('food');
            ok(res.food, 'we get food back');
        });
        test('strange characters', function () {
            can.route.routes = {};
            can.route(':type/:id');
            var res = can.route.deparam('foo/' + encodeURIComponent('/'));
            equal(res.id, '/');
            res = can.route.param({
                type: 'bar',
                id: '/'
            });
            equal(res, 'bar/' + encodeURIComponent('/'));
        });
        if (typeof steal !== 'undefined') {
            var makeTestingIframe = function (callback) {
                window.routeTestReady = function (iCanRoute, loc, history, win) {
                    callback({
                        route: iCanRoute,
                        location: loc,
                        history: history,
                        window: win,
                        iframe: iframe
                    }, function () {
                        iframe.onload = null;
                        can.remove(can.$(iframe));
                        delete window.routeTestReady;
                    });
                };
                var iframe = document.createElement('iframe');
                iframe.src = can.test.path('route/pushstate/testing.html') + '?' + Math.random();
                can.$('#qunit-fixture')[0].appendChild(iframe);
            };
            test('updating the url', function () {
                stop();
                makeTestingIframe(function (info, done) {
                    info.route.ready();
                    info.route('/:type/:id');
                    info.route.attr({
                        type: 'bar',
                        id: '5'
                    });
                    setTimeout(function () {
                        var after = info.location.pathname;
                        equal(after, '/bar/5', 'path is ' + after);
                        start();
                        done();
                    }, 100);
                });
            });
            test('sticky enough routes', function () {
                stop();
                makeTestingIframe(function (info, done) {
                    info.route('/active');
                    info.route('');
                    info.history.pushState(null, null, '/active');
                    setTimeout(function () {
                        var after = info.location.pathname;
                        equal(after, '/active');
                        start();
                        done();
                    }, 30);
                });
            });
            test('unsticky routes', function () {
                stop();
                window.routeTestReady = function (iCanRoute, loc, iframeHistory) {
                    iframeHistory.pushState(null, null, '/bar/' + encodeURIComponent('/'));
                    setTimeout(function timer() {
                        if ('/bar/' + encodeURIComponent('/') === loc.pathname) {
                            runTest();
                        } else if (loc.pathname.indexOf('/bar/') >= 0) {
                            ok(true, 'can\'t test!');
                            can.remove(can.$(iframe));
                            start();
                        } else {
                            setTimeout(timer, 30);
                        }
                    }, 30);
                    var runTest = function () {
                        iCanRoute.ready();
                        iCanRoute('/:type');
                        iCanRoute('/:type/:id');
                        iCanRoute.attr({ type: 'bar' });
                        setTimeout(function () {
                            var after = loc.pathname;
                            equal(after, '/bar', 'only type is set');
                            iCanRoute.attr({
                                type: 'bar',
                                id: '/'
                            });
                            var time = new Date();
                            setTimeout(function innerTimer() {
                                var after = loc.pathname;
                                if (after === '/bar/' + encodeURIComponent('/')) {
                                    equal(after, '/bar/' + encodeURIComponent('/'), 'should go to type/id');
                                    can.remove(can.$(iframe));
                                    start();
                                } else if (new Date() - time > 2000) {
                                    ok(false, 'hash is ' + after);
                                    can.remove(can.$(iframe));
                                } else {
                                    setTimeout(innerTimer, 30);
                                }
                            }, 30);
                        }, 30);
                    };
                };
                var iframe = document.createElement('iframe');
                iframe.src = can.test.path('route/pushstate/testing.html?1');
                can.$('#qunit-fixture')[0].appendChild(iframe);
            });
            test('clicked hashes work (#259)', function () {
                stop();
                window.routeTestReady = function (iCanRoute, loc, hist, win) {
                    iCanRoute(win.location.pathname, { page: 'index' });
                    iCanRoute(':type/:id');
                    iCanRoute.ready();
                    window.win = win;
                    var link = win.document.createElement('a');
                    link.href = '/articles/17#references';
                    link.innerHTML = 'Click Me';
                    win.document.body.appendChild(link);
                    win.can.trigger(win.can.$(link), 'click');
                    setTimeout(function () {
                        deepEqual(can.extend({}, iCanRoute.attr()), {
                            type: 'articles',
                            id: '17',
                            route: ':type/:id'
                        }, 'articles are right');
                        equal(win.location.hash, '#references', 'includes hash');
                        start();
                        can.remove(can.$(iframe));
                    }, 100);
                };
                var iframe = document.createElement('iframe');
                iframe.src = can.test.path('route/pushstate/testing.html');
                can.$('#qunit-fixture')[0].appendChild(iframe);
            });
            test('javascript:// links do not get pushstated', function () {
                stop();
                makeTestingIframe(function (info, done) {
                    info.route(':type', { type: 'yay' });
                    info.route.ready();
                    var window = info.window;
                    var link = window.document.createElement('a');
                    link.href = 'javascript://';
                    link.innerHTML = 'Click Me';
                    window.document.body.appendChild(link);
                    try {
                        window.can.trigger(window.can.$(link), 'click');
                        ok(true, 'Clicking javascript:// anchor did not cause a security exception');
                    } catch (err) {
                        ok(false, 'Clicking javascript:// anchor caused a security exception');
                    }
                    start();
                    done();
                });
            });
            if (window.parent === window) {
                test('no doubled history states (#656)', function () {
                    stop();
                    window.routeTestReady = function (iCanRoute, loc, hist, win) {
                        var root = loc.pathname.substr(0, loc.pathname.lastIndexOf('/') + 1);
                        var stateTest = -1, message;
                        function nextStateTest() {
                            stateTest++;
                            win.can.route.attr('page', 'start');
                            setTimeout(function () {
                                if (stateTest === 0) {
                                    message = 'can.route.attr';
                                    win.can.route.attr('page', 'test');
                                } else if (stateTest === 1) {
                                    message = 'history.pushState';
                                    win.history.pushState(null, null, root + 'test/');
                                } else if (stateTest === 2) {
                                    message = 'link click';
                                    var link = win.document.createElement('a');
                                    link.href = root + 'test/';
                                    link.innerText = 'asdf';
                                    win.document.body.appendChild(link);
                                    win.can.trigger(win.can.$(link), 'click');
                                } else {
                                    start();
                                    can.remove(can.$(iframe));
                                    return;
                                }
                                setTimeout(function () {
                                    win.history.back();
                                    setTimeout(function () {
                                        var path = win.location.pathname;
                                        if (path.indexOf(root) === 0) {
                                            path = path.substr(root.length);
                                        }
                                        equal(win.can.route.deparam(path).page, 'start', message + ' passed');
                                        nextStateTest();
                                    }, 200);
                                }, 200);
                            }, 200);
                        }
                        win.can.route.bindings.pushstate.root = root;
                        win.can.route(':page/');
                        win.can.route.ready();
                        nextStateTest();
                    };
                    var iframe = document.createElement('iframe');
                    iframe.src = can.test.path('route/pushstate/testing.html');
                    can.$('#qunit-fixture')[0].appendChild(iframe);
                });
                test('root can include the domain', function () {
                    stop();
                    makeTestingIframe(function (info, done) {
                        info.route.bindings.pushstate.root = can.test.path('route/pushstate/testing.html', true).replace('route/pushstate/testing.html', '');
                        info.route(':module/:plugin/:page\\.html');
                        info.route.ready();
                        setTimeout(function () {
                            equal(info.route.attr('module'), 'route', 'works');
                            start();
                            done();
                        }, 100);
                    });
                });
                test('URL\'s don\'t greedily match', function () {
                    stop();
                    makeTestingIframe(function (info, done) {
                        info.route.bindings.pushstate.root = can.test.path('route/pushstate/testing.html', true).replace('route/pushstate/testing.html', '');
                        info.route(':module\\.html');
                        info.route.ready();
                        setTimeout(function () {
                            ok(!info.route.attr('module'), 'there is no route match');
                            start();
                            done();
                        }, 100);
                    });
                });
            }
            test('routed links must descend from pushstate root (#652)', 1, function () {
                stop();
                var setupRoutesAndRoot = function (iCanRoute, root) {
                    iCanRoute(':section/');
                    iCanRoute(':section/:sub/');
                    iCanRoute.bindings.pushstate.root = root;
                    iCanRoute.ready();
                };
                var createLink = function (win, url) {
                    var link = win.document.createElement('a');
                    link.href = link.innerHTML = url;
                    win.document.body.appendChild(link);
                    return link;
                };
                makeTestingIframe(function (info, done) {
                    setupRoutesAndRoot(info.route, '/app/');
                    var link = createLink(info.window, '/route/pushstate/empty.html');
                    var clickKiller = function (ev) {
                        if (ev.preventDefault) {
                            ev.preventDefault();
                        }
                        return false;
                    };
                    can.bind.call(info.window.document, 'click', clickKiller);
                    info.history.pushState = function () {
                        ok(false, 'pushState should not have been called');
                    };
                    eventFire(link, 'click');
                    done();
                    setTimeout(next, 10);
                });
                var next = function () {
                    makeTestingIframe(function (info, done) {
                        var timer;
                        info.route.bind('change', function () {
                            clearTimeout(timer);
                            timer = setTimeout(function () {
                                var obj = can.simpleExtend({}, info.route.attr());
                                deepEqual(obj, {
                                    section: 'something',
                                    sub: 'test',
                                    route: ':section/:sub/'
                                }, 'route\'s data is correct');
                                done();
                                start();
                            }, 10);
                        });
                        setupRoutesAndRoot(info.route, '/app/');
                        var link = createLink(info.window, '/app/something/test/');
                        eventFire(link, 'click');
                    });
                };
            });
            test('replaceStateOn makes changes to an attribute use replaceSate (#1137)', function () {
                stop();
                makeTestingIframe(function (info, done) {
                    info.history.pushState = function () {
                        ok(false, 'pushState should not have been called');
                    };
                    info.history.replaceState = function () {
                        ok(true, 'replaceState called');
                    };
                    info.route.replaceStateOn('ignoreme');
                    info.route.ready();
                    info.route.attr('ignoreme', 'yes');
                    setTimeout(function () {
                        start();
                        done();
                    }, 30);
                });
            });
            test('replaceStateOn makes changes to multiple attributes use replaceState (#1137)', function () {
                stop();
                makeTestingIframe(function (info, done) {
                    info.history.pushState = function () {
                        ok(false, 'pushState should not have been called');
                    };
                    info.history.replaceState = function () {
                        ok(true, 'replaceState called');
                    };
                    info.route.replaceStateOn('ignoreme', 'metoo');
                    info.route.ready();
                    info.route.attr('ignoreme', 'yes');
                    setTimeout(function () {
                        info.route.attr('metoo', 'yes');
                        setTimeout(function () {
                            start();
                            done();
                        }, 30);
                    }, 30);
                });
            });
            test('replaceStateOnce makes changes to an attribute use replaceState only once (#1137)', function () {
                stop();
                var replaceCalls = 0, pushCalls = 0;
                makeTestingIframe(function (info, done) {
                    info.history.pushState = function () {
                        pushCalls++;
                    };
                    info.history.replaceState = function () {
                        replaceCalls++;
                    };
                    info.route.replaceStateOnce('ignoreme', 'metoo');
                    info.route.ready();
                    info.route.attr('ignoreme', 'yes');
                    setTimeout(function () {
                        info.route.attr('ignoreme', 'no');
                        setTimeout(function () {
                            equal(replaceCalls, 1);
                            equal(pushCalls, 1);
                            start();
                            done();
                        }, 30);
                    }, 30);
                });
            });
            test('replaceStateOff makes changes to an attribute use pushState again (#1137)', function () {
                stop();
                makeTestingIframe(function (info, done) {
                    info.history.pushState = function () {
                        ok(true, 'pushState called');
                    };
                    info.history.replaceState = function () {
                        ok(false, 'replaceState should not be called called');
                    };
                    info.route.replaceStateOn('ignoreme');
                    info.route.replaceStateOff('ignoreme');
                    info.route.ready();
                    info.route.attr('ignoreme', 'yes');
                    setTimeout(function () {
                        start();
                        done();
                    }, 30);
                });
            });
        }
        test('empty default is matched even if last', function () {
            can.route.routes = {};
            can.route(':who');
            can.route('', { foo: 'bar' });
            var obj = can.route.deparam('');
            deepEqual(obj, {
                foo: 'bar',
                route: ''
            });
        });
        test('order matched', function () {
            can.route.routes = {};
            can.route(':foo');
            can.route(':bar');
            var obj = can.route.deparam('abc');
            deepEqual(obj, {
                foo: 'abc',
                route: ':foo'
            });
        });
        test('param order matching', function () {
            can.route.routes = {};
            can.route('', { bar: 'foo' });
            can.route('something/:bar');
            var res = can.route.param({ bar: 'foo' });
            equal(res, '', 'picks the shortest, best match');
            can.route.routes = {};
            can.route(':recipe', {
                recipe: 'recipe1',
                task: 'task3'
            });
            can.route(':recipe/:task', {
                recipe: 'recipe1',
                task: 'task3'
            });
            res = can.route.param({
                recipe: 'recipe1',
                task: 'task3'
            });
            equal(res, '', 'picks the first match of everything');
            res = can.route.param({
                recipe: 'recipe1',
                task: 'task2'
            });
            equal(res, '/task2');
        });
        test('dashes in routes', function () {
            can.route.routes = {};
            can.route(':foo-:bar');
            var obj = can.route.deparam('abc-def');
            deepEqual(obj, {
                foo: 'abc',
                bar: 'def',
                route: ':foo-:bar'
            });
        });
    }
});
/*model/queue/queue_test*/
define('can/model/queue/queue_test', function (require, exports, module) {
    var can = require('can/util/util');
    require('can/model/model');
    require('can/model/queue/queue');
    require('can/util/fixture/fixture');
    require('can/test/test');
    require('steal-qunit');
    QUnit.module('can/model/queue', {
        setup: function () {
        }
    });
    test('queued requests will not overwrite attrs', function () {
        var delay = can.fixture.delay;
        can.fixture.delay = 1000;
        can.Model.extend('Person', {
            create: function (id, attrs, success, error) {
                return can.ajax({
                    url: '/people/' + id,
                    data: attrs,
                    type: 'post',
                    dataType: 'json',
                    fixture: function () {
                        return { name: 'Justin' };
                    },
                    success: success
                });
            }
        }, {});
        var person = new Person({ name: 'Justin' }), personD = person.save();
        person.attr('name', 'Brian');
        stop();
        personD.then(function (person) {
            start();
            equal(person.name, 'Brian', 'attrs were not overwritten with the data from the server');
            can.fixture.delay = delay;
        });
    });
    test('error will clean up the queue', 2, function () {
        can.Model('User', {
            create: 'POST /users',
            update: 'PUT /users/{id}'
        }, {});
        can.fixture('POST /users', function (req) {
            return { id: 1 };
        });
        can.fixture('PUT /users/{id}', function (req, respondWith) {
            respondWith(500);
        });
        var u = new User({ name: 'Goku' });
        stop();
        u.save();
        var err = u.save();
        u.save();
        u.save();
        u.save();
        err.fail(function () {
            start();
            equal(u._requestQueue.attr('length'), 4, 'Four requests are in the queue');
            stop();
            u._requestQueue.bind('change', function () {
                start();
                equal(u._requestQueue.attr('length'), 0, 'Request queue was emptied');
            });
        });
    });
    test('backup works as expected', function () {
        can.Model('User', {
            create: 'POST /users',
            update: 'PUT /users/{id}'
        }, {});
        can.fixture('POST /users', function (req) {
            return {
                id: 1,
                name: 'Goku'
            };
        });
        can.fixture('PUT /users/{id}', function (req, respondWith) {
            respondWith(500);
        });
        var u = new User({ name: 'Goku' });
        stop();
        var save = u.save();
        u.attr('name', 'Krillin');
        save.then(function () {
            start();
            equal(u.attr('name'), 'Krillin', 'Name is not overwritten when save is successful');
            stop();
        });
        var err = u.save();
        err.fail(function () {
            u.restore(true);
            start();
            equal(u.attr('name'), 'Goku', 'Name was restored to the last value successfuly returned from the server');
        });
    });
    test('abort will remove requests made after the aborted request', function () {
        can.Model('User', {
            create: 'POST /users',
            update: 'PUT /users/{id}'
        }, {});
        can.fixture('POST /users', function (req) {
            return {
                id: 1,
                name: 'Goku'
            };
        });
        can.fixture('PUT /users/{id}', function (req, respondWith) {
            return req.data;
        });
        var u = new User({ name: 'Goku' });
        u.save();
        u.save();
        var abort = u.save();
        u.save();
        u.save();
        equal(u._requestQueue.attr('length'), 5);
        abort.abort();
        equal(u._requestQueue.attr('length'), 2);
    });
    test('id will be set correctly, although update data is serialized before create is done', function () {
        var delay = can.fixture.delay;
        can.fixture.delay = 1000;
        can.Model('Hero', {
            create: 'POST /superheroes',
            update: 'PUT /superheroes/{id}'
        }, {});
        can.fixture('POST /superheroes', function (req) {
            return { id: 'FOOBARBAZ' };
        });
        can.fixture('PUT /superheroes/{id}', function (req, respondWith) {
            start();
            equal(req.data.id, 'FOOBARBAZ', 'Correct id is set');
            can.fixture.delay = delay;
            return req.data;
        });
        var u = new Hero({ name: 'Goku' });
        u.save();
        u.save();
        stop();
    });
    test('queue uses serialize (#611)', function () {
        can.fixture('POST /mymodel', function (request) {
            equal(request.data.foo, 'bar');
            start();
        });
        var MyModel = can.Model.extend({ create: '/mymodel' }, {
            serialize: function () {
                return { foo: 'bar' };
            }
        });
        stop();
        new MyModel().save();
    });
});
/*construct/super/super_test*/
define('can/construct/super/super_test', function (require, exports, module) {
    require('can/construct/super/super');
    require('steal-qunit');
    QUnit.module('can/construct/super');
    test('prototype super', function () {
        var A = can.Construct({
            init: function (arg) {
                this.arg = arg + 1;
            },
            add: function (num) {
                return this.arg + num;
            }
        });
        var B = A({
            init: function (arg) {
                this._super(arg + 2);
            },
            add: function (arg) {
                return this._super(arg + 1);
            }
        });
        var b = new B(1);
        equal(b.arg, 4);
        equal(b.add(2), 7);
    });
    test('static super', function () {
        var First = can.Construct({
            raise: function (num) {
                return num;
            }
        }, {});
        var Second = First({
            raise: function (num) {
                return this._super(num) * num;
            }
        }, {});
        equal(Second.raise(2), 4);
    });
    test('findAll super', function () {
        var Parent = can.Construct({
            findAll: function () {
                equal(this.shortName, 'child');
                return new can.Deferred();
            },
            shortName: 'parent'
        }, {});
        var Child = Parent({
            findAll: function () {
                return this._super();
            },
            shortName: 'child'
        }, {});
        stop();
        expect(1);
        Child.findAll({});
        start();
    });
});
/*construct/proxy/proxy_test*/
define('can/construct/proxy/proxy_test', function (require, exports, module) {
    require('can/construct/proxy/proxy');
    require('can/control/control');
    require('steal-qunit');
    QUnit.module('can/construct/proxy');
    test('static proxy if control is loaded first', function () {
        var curVal = 0;
        expect(2);
        can.Control('Car', {
            show: function (value) {
                equal(curVal, value);
            }
        }, {});
        var cb = Car.proxy('show');
        curVal = 1;
        cb(1);
        curVal = 2;
        var cb2 = Car.proxy('show', 2);
        cb2();
    });
    test('proxy', function () {
        var curVal = 0;
        expect(2);
        can.Construct('Car', {
            show: function (value) {
                equal(curVal, value);
            }
        }, {});
        var cb = Car.proxy('show');
        curVal = 1;
        cb(1);
        curVal = 2;
        var cb2 = Car.proxy('show', 2);
        cb2();
    });
    test('proxy error', 1, function () {
        can.Construct('Car', {});
        try {
            Car.proxy('huh');
            ok(false, 'I should have errored');
        } catch (e) {
            ok(true, 'Error was thrown');
        }
    });
});
/*can@2.3.18#map/lazy/nested_reference.js*/
define('can/map/lazy/nested_reference.js', function (require, exports, module) {
    var can = require('can/util/util');
    var pathIterator = function (root, propPath, callback) {
        var props = propPath.split('.'), cur = root, part;
        while (part = props.shift()) {
            cur = cur[part];
            if (callback) {
                callback(cur, part);
            }
        }
        return cur;
    };
    var ArrIndex = function (array) {
        this.array = array;
    };
    ArrIndex.prototype.toString = function () {
        return '' + can.inArray(this.item, this.array);
    };
    var NestedReference = function (root) {
        this.root = root;
        this.references = [];
    };
    NestedReference.ArrIndex = ArrIndex;
    can.extend(NestedReference.prototype, {
        make: function (propPath) {
            var path = [], arrIndex;
            if (can.isArray(this.root) || this.root instanceof can.LazyList) {
                arrIndex = new ArrIndex(this.root);
            }
            pathIterator(this.root, propPath, function (item, prop) {
                if (arrIndex) {
                    arrIndex.item = item;
                    path.push(arrIndex);
                    arrIndex = undefined;
                } else {
                    path.push(prop);
                    if (can.isArray(item)) {
                        arrIndex = new ArrIndex(item);
                    }
                }
            });
            var pathFunc = function () {
                return path.join('.');
            };
            this.references.push(pathFunc);
            return pathFunc;
        },
        removeChildren: function (path, callback) {
            var i = 0;
            while (i < this.references.length) {
                var reference = this.references[i]();
                if (reference.indexOf(path) === 0) {
                    callback(this.get(reference), reference);
                    this.references.splice(i, 1);
                } else {
                    i++;
                }
            }
        },
        get: function (path) {
            return pathIterator(this.root, path);
        },
        each: function (callback) {
            var self = this;
            can.each(this.references, function (ref) {
                var path = ref();
                callback(self.get(path), ref, path);
            });
        }
    });
    can.NestedReference = NestedReference;
});
/*can@2.3.18#map/lazy/nested_reference_test.js*/
define('can/map/lazy/nested_reference_test.js', function (require, exports, module) {
    var can = require('can/util/util');
    require('can/map/lazy/nested_reference.js');
    require('steal-qunit');
    QUnit.module('can/map/lazy/nested_reference');
    test('Basics', 3, function () {
        var data = [
            {
                id: 0,
                items: [
                    { id: '0.0' },
                    { id: '0.1' }
                ]
            },
            {
                id: 1,
                items: [
                    { id: '1.0' },
                    { id: '1.1' },
                    { id: '1.2' }
                ]
            }
        ];
        var nested = new can.NestedReference(data), ref1 = nested.make('1.items.1'), ref2 = nested.make('1.items.2');
        nested.make('0.items.1');
        equal(ref1(), '1.items.1', 'Path created correctly');
        data[1].items.shift();
        equal(ref1(), '1.items.0', 'Path updated correctly after shifting - ref1');
        equal(ref2(), '1.items.1', 'Path updated correctly after shifting - ref2');
    });
    test('Removing children', 5, function () {
        var data = [
            {
                id: 0,
                items: [
                    { id: '0.0' },
                    { id: '0.1' }
                ]
            },
            {
                id: 1,
                items: [
                    { id: '1.0' },
                    { id: '1.1' },
                    { id: '1.2' }
                ]
            }
        ];
        var nested = new can.NestedReference(data), count = 0;
        nested.make('1.items.1');
        nested.make('1.items.2');
        nested.make('0.items.1');
        nested.removeChildren('1.items', function (child, ref) {
            count++;
            if (count === 1) {
                equal(child, data[1].items[1], 'Reference removed - correct child');
                equal(ref, '1.items.1', 'Reference removed - correct path');
            } else if (count === 2) {
                equal(child, data[1].items[2], 'Reference removed - correct child');
                equal(ref, '1.items.2', 'Referece removed - correct path');
            }
        });
        equal(nested.references.length, 1, '\'1.items*\' references removed, \'0.items.1\' remains.');
    });
    test('\'.each\' iterator', 2, function () {
        var data = [
                {
                    id: 0,
                    items: [
                        { id: '0.0' },
                        { id: '0.1' }
                    ]
                },
                {
                    id: 1,
                    items: [
                        { id: '1.0' },
                        { id: '1.1' }
                    ]
                }
            ], nested = new can.NestedReference(data);
        nested.make('0.items');
        nested.make('1.items.0');
        var callbackCount = 0;
        nested.each(function (child, ref, path) {
            callbackCount++;
            if (callbackCount === 1) {
                equal(child, data[0].items, 'First reference exists - \'0.items\'');
            } else {
                equal(child, data[1].items[0], 'Second reference exists -\'1.items.0\'');
            }
        });
    });
});
/*can@2.3.18#map/lazy/map_test.js*/
define('can/map/lazy/map_test.js', function (require, exports, module) {
    var can = require('can/util/util');
    require('can/map/lazy/lazy');
    require('can/compute/compute');
    require('steal-qunit');
    QUnit.module('can/map/lazy');
    test('Basic Map', 4, function () {
        var state = new can.LazyMap({
            category: 5,
            productType: 4
        });
        state.bind('change', function (ev, attr, how, val, old) {
            equal(attr, 'category', 'correct change name');
            equal(how, 'set');
            equal(val, 6, 'correct');
            equal(old, 5, 'correct');
        });
        state.attr('category', 6);
        state.unbind('change');
    });
    test('Nested Map', 5, function () {
        var me = new can.LazyMap({
            name: {
                first: 'Justin',
                last: 'Meyer'
            }
        });
        ok(me.attr('name') instanceof can.LazyMap);
        me.bind('change', function (ev, attr, how, val, old) {
            equal(attr, 'name.first', 'correct change name');
            equal(how, 'set');
            equal(val, 'Brian', 'correct');
            equal(old, 'Justin', 'correct');
        });
        me.attr('name.first', 'Brian');
        me.unbind('change');
    });
    test('remove attr', function () {
        var state = new can.LazyMap({
            category: 5,
            productType: 4
        });
        state.removeAttr('category');
        deepEqual(can.LazyMap.keys(state), ['productType'], 'one property');
    });
    test('nested event handlers are not run by changing the parent property (#280)', function () {
        var person = new can.LazyMap({ name: { first: 'Justin' } });
        person.bind('name.first', function (ev, newName) {
            ok(false, 'name.first should never be called');
        });
        person.bind('name', function () {
            ok(true, 'name event triggered');
        });
        person.attr('name', { first: 'Hank' });
    });
    test('cyclical objects (#521)', 0, function () {
    });
    test('Getting attribute that is a can.compute should return the compute and not the value of the compute (#530)', function () {
        var compute = can.compute('before');
        var map = new can.LazyMap({ time: compute });
        equal(map.time, compute, 'dot notation call of time is compute');
        equal(map.attr('time'), compute, '.attr() call of time is compute');
    });
    test('_cid add to original object', function () {
        var map = new can.LazyMap(), obj = { 'name': 'thecountofzero' };
        map.attr('myObj', obj);
        ok(!obj._cid, '_cid not added to original object');
    });
    test('can.each used with maps', function () {
        can.each(new can.LazyMap({ foo: 'bar' }), function (val, attr) {
            if (attr === 'foo') {
                equal(val, 'bar');
            } else {
                ok(false, 'no properties other should be called ' + attr);
            }
        });
    });
    test('can.Map serialize triggers reading (#626)', function () {
        var old = can.__observe;
        var attributesRead = [];
        var readingTriggeredForKeys = false;
        can.__observe = function (object, attribute) {
            if (attribute === '__keys') {
                readingTriggeredForKeys = true;
            } else {
                attributesRead.push(attribute);
            }
        };
        var testMap = new can.LazyMap({
            cats: 'meow',
            dogs: 'bark'
        });
        testMap.serialize = can.LazyMap.prototype.serialize;
        testMap.serialize();
        ok(can.inArray('cats', attributesRead) !== -1 && can.inArray('dogs', attributesRead) !== -1, 'map serialization triggered __reading on all attributes');
        ok(readingTriggeredForKeys, 'map serialization triggered __reading for __keys');
        can.__observe = old;
    });
    test('Test top level attributes', 7, function () {
        var test = new can.LazyMap({
            'my.enable': false,
            'my.item': true,
            'my.count': 0,
            'my.newCount': 1,
            'my': {
                'value': true,
                'nested': { 'value': 100 }
            }
        });
        equal(test.attr('my.value'), true, 'correct');
        equal(test.attr('my.nested.value'), 100, 'correct');
        ok(test.attr('my.nested') instanceof can.LazyMap);
        equal(test.attr('my.enable'), false, 'falsey (false) value accessed correctly');
        equal(test.attr('my.item'), true, 'truthey (true) value accessed correctly');
        equal(test.attr('my.count'), 0, 'falsey (0) value accessed correctly');
        equal(test.attr('my.newCount'), 1, 'falsey (1) value accessed correctly');
    });
});
/*can@2.3.18#map/lazy/observe_test.js*/
define('can/map/lazy/observe_test.js', function (require, exports, module) {
    var can = require('can/util/util');
    require('can/observe/observe');
    require('can/map/lazy/lazy');
    require('steal-qunit');
    QUnit.module('can/map/lazy map+list');
    test('Basic Map', 9, function () {
        var state = new can.LazyMap({
            category: 5,
            productType: 4,
            properties: {
                brand: [],
                model: [],
                price: []
            }
        });
        var added;
        state.bind('change', function (ev, attr, how, val, old) {
            equal(attr, 'properties.brand.0', 'correct change name');
            equal(how, 'add');
            equal(val[0].attr('foo'), 'bar', 'correct');
            added = val[0];
        });
        state.attr('properties.brand').push({ foo: 'bar' });
        state.unbind('change');
        added.bind('change', function (ev, attr, how, val, old) {
            equal(attr, 'foo', 'foo property set on added');
            equal(how, 'set', 'added');
            equal(val, 'zoo', 'added');
        });
        state.bind('change', function (ev, attr, how, val, old) {
            equal(attr, 'properties.brand.0.foo');
            equal(how, 'set');
            equal(val, 'zoo');
        });
        added.attr('foo', 'zoo');
    });
    test('list attr changes length', function () {
        var l = new can.List([
            0,
            1,
            2
        ]);
        l.attr(3, 3);
        equal(l.length, 4);
    });
    test('list splice', function () {
        var l = new can.List([
                0,
                1,
                2,
                3
            ]), first = true;
        l.bind('change', function (ev, attr, how, newVals, oldVals) {
            equal(attr, '1');
            if (first) {
                equal(how, 'remove', 'removing items');
                equal(newVals, undefined, 'no new Vals');
            } else {
                deepEqual(newVals, [
                    'a',
                    'b'
                ], 'got the right newVals');
                equal(how, 'add', 'adding items');
            }
            first = false;
        });
        l.splice(1, 2, 'a', 'b');
        deepEqual(l.serialize(), [
            0,
            'a',
            'b',
            3
        ], 'serialized');
    });
    test('list pop', function () {
        var l = new can.List([
            0,
            1,
            2,
            3
        ]);
        l.bind('change', function (ev, attr, how, newVals, oldVals) {
            equal(attr, '3');
            equal(how, 'remove');
            equal(newVals, undefined);
            deepEqual(oldVals, [3]);
        });
        l.pop();
        deepEqual(l.serialize(), [
            0,
            1,
            2
        ]);
    });
    test('changing an object unbinds', 4, function () {
        var state = new can.LazyMap({
                category: 5,
                productType: 4,
                properties: {
                    brand: [],
                    model: [],
                    price: []
                }
            }), count = 0;
        var brand = state.attr('properties.brand');
        state.bind('change', function (ev, attr, how, val, old) {
            equal(attr, 'properties.brand');
            equal(count, 0, 'count called once');
            count++;
            equal(how, 'set');
            equal(val[0], 'hi');
        });
        state.attr('properties.brand', ['hi']);
        brand.push(1, 2, 3);
    });
    test('replacing with an object that object becomes observable', function () {
        var state = new can.LazyMap({
            properties: {
                brand: [],
                model: [],
                price: []
            }
        });
        ok(state.attr('properties').bind, 'has bind function');
        state.attr('properties', {});
        ok(state.attr('properties').bind, 'has bind function');
    });
    test('attr does not blow away old observable', function () {
        var state = new can.LazyMap({ properties: { brand: ['gain'] } });
        var oldCid = state.attr('properties.brand')._cid;
        state.attr({ properties: { brand: [] } }, true);
        deepEqual(state.attr('properties.brand')._cid, oldCid, 'should be the same map, so that views bound to the old one get updates');
        equal(state.attr('properties.brand').length, 0, 'list should be empty');
    });
    test('sub observes respect attr remove parameter', function () {
        var bindCalled = 0, state = new can.LazyMap({ monkey: { tail: 'brain' } });
        state.bind('change', function (ev, attr, how, newVal, old) {
            bindCalled++;
            equal(attr, 'monkey.tail');
            equal(old, 'brain');
            equal(how, 'remove');
        });
        state.attr({ monkey: {} });
        equal('brain', state.attr('monkey.tail'), 'should not remove attribute of sub map when remove param is false');
        equal(0, bindCalled, 'remove event not fired for sub map when remove param is false');
        state.attr({ monkey: {} }, true);
        equal(undefined, state.attr('monkey.tail'), 'should remove attribute of sub map when remove param is false');
        equal(1, bindCalled, 'remove event fired for sub map when remove param is false');
    });
    test('remove attr', function () {
        var state = new can.LazyMap({
            properties: {
                brand: [],
                model: [],
                price: []
            }
        });
        state.bind('change', function (ev, attr, how, newVal, old) {
            equal(attr, 'properties');
            equal(how, 'remove');
            deepEqual(old.serialize(), {
                brand: [],
                model: [],
                price: []
            });
        });
        state.removeAttr('properties');
        equal(undefined, state.attr('properties'));
    });
    test('remove nested attr', function () {
        var state = new can.LazyMap({ properties: { nested: true } });
        state.bind('change', function (ev, attr, how, newVal, old) {
            equal(attr, 'properties.nested');
            equal(how, 'remove');
            deepEqual(old, true);
        });
        state.removeAttr('properties.nested');
        equal(undefined, state.attr('properties.nested'));
    });
    test('remove item in nested array', function () {
        var state = new can.LazyMap({
            array: [
                'a',
                'b'
            ]
        });
        state.bind('change', function (ev, attr, how, newVal, old) {
            equal(attr, 'array.1');
            equal(how, 'remove');
            deepEqual(old, ['b']);
        });
        state.removeAttr('array.1');
        equal(state.attr('array.length'), 1);
    });
    test('remove nested property in item of array', function () {
        var state = new can.LazyMap({ array: [{ nested: true }] });
        state.bind('change', function (ev, attr, how, newVal, old) {
            equal(attr, 'array.0.nested');
            equal(how, 'remove');
            deepEqual(old, true);
        });
        state.removeAttr('array.0.nested');
        equal(undefined, state.attr('array.0.nested'));
    });
    test('remove nested property in item of array map', function () {
        var state = new can.List([{ nested: true }]);
        state.bind('change', function (ev, attr, how, newVal, old) {
            equal(attr, '0.nested');
            equal(how, 'remove');
            deepEqual(old, true);
        });
        state.removeAttr('0.nested');
        equal(undefined, state.attr('0.nested'));
    });
    test('attr with an object', function () {
        var state = new can.LazyMap({
            properties: {
                foo: 'bar',
                brand: []
            }
        });
        state.bind('change', function (ev, attr, how, newVal) {
            equal(attr, 'properties.foo', 'foo has changed');
            equal(newVal, 'bad');
        });
        state.attr({
            properties: {
                foo: 'bar',
                brand: []
            }
        });
        state.attr({
            properties: {
                foo: 'bad',
                brand: []
            }
        });
        state.unbind('change');
        state.bind('change', function (ev, attr, how, newVal) {
            equal(attr, 'properties.brand.0');
            equal(how, 'add');
            deepEqual(newVal, ['bad']);
        });
        state.attr({
            properties: {
                foo: 'bad',
                brand: ['bad']
            }
        });
    });
    test('empty get', function () {
        var state = new can.LazyMap({});
        equal(state.attr('foo.bar'), undefined);
    });
    test('attr deep array ', function () {
        var state = new can.LazyMap({});
        var arr = [{ foo: 'bar' }], thing = { arr: arr };
        state.attr({ thing: thing }, true);
        ok(thing.arr === arr, 'thing unmolested');
    });
    test('attr semi-serialize', function () {
        var first = {
                foo: { bar: 'car' },
                arr: [
                    1,
                    2,
                    3,
                    { four: '5' }
                ]
            }, compare = {
                foo: { bar: 'car' },
                arr: [
                    1,
                    2,
                    3,
                    { four: '5' }
                ]
            };
        var res = new can.LazyMap(first).attr();
        deepEqual(res, compare, 'test');
    });
    test('attr sends events after it is done', function () {
        var state = new can.LazyMap({
            foo: 1,
            bar: 2
        });
        state.bind('change', function () {
            equal(state.attr('foo'), -1, 'foo set');
            equal(state.attr('bar'), -2, 'bar set');
        });
        state.attr({
            foo: -1,
            bar: -2
        });
    });
    test('direct property access', function () {
        var state = new can.LazyMap({
            foo: 1,
            attr: 2
        });
        equal(state.foo, 1);
        equal(typeof state.attr, 'function');
    });
    test('pop unbinds', function () {
        var l = new can.List([{ foo: 'bar' }]);
        var o = l.attr(0), count = 0;
        l.bind('change', function (ev, attr, how, newVal, oldVal) {
            count++;
            if (count === 1) {
                equal(attr, '0.foo', 'count is set');
            } else if (count === 2) {
                equal(how, 'remove', 'remove event called');
                equal(attr, '0', 'remove event called with correct index');
            } else {
                ok(false, 'change handler called too many times');
            }
        });
        equal(o.attr('foo'), 'bar');
        o.attr('foo', 'car');
        l.pop();
        o.attr('foo', 'bad');
    });
    test('splice unbinds', function () {
        var l = new can.List([{ foo: 'bar' }]);
        var o = l.attr(0), count = 0;
        l.bind('change', function (ev, attr, how, newVal, oldVal) {
            count++;
            if (count === 1) {
                equal(attr, '0.foo', 'count is set');
            } else if (count === 2) {
                equal(how, 'remove');
                equal(attr, '0');
            } else {
                ok(false, 'called too many times');
            }
        });
        equal(o.attr('foo'), 'bar');
        o.attr('foo', 'car');
        l.splice(0, 1);
        o.attr('foo', 'bad');
    });
    test('always gets right attr even after moving array items', function () {
        var l = new can.List([{ foo: 'bar' }]);
        var o = l.attr(0);
        l.unshift('A new Value');
        l.bind('change', function (ev, attr, how) {
            equal(attr, '1.foo');
        });
        o.attr('foo', 'led you');
    });
    test('recursive observers do not cause stack overflow', function () {
        expect(0);
        var a = new can.LazyMap();
        var b = new can.LazyMap({ a: a });
        a.attr('b', b);
    });
    test('bind to specific attribute changes when an existing attribute\'s value is changed', function () {
        var paginate = new can.LazyMap({
            offset: 100,
            limit: 100,
            count: 2000
        });
        paginate.bind('offset', function (ev, newVal, oldVal) {
            equal(newVal, 200);
            equal(oldVal, 100);
        });
        paginate.attr('offset', 200);
    });
    test('bind to specific attribute changes when an attribute is removed', 2, function () {
        var paginate = new can.LazyMap({
            offset: 100,
            limit: 100,
            count: 2000
        });
        paginate.bind('offset', function (ev, newVal, oldVal) {
            equal(newVal, undefined);
            equal(oldVal, 100);
        });
        paginate.removeAttr('offset');
    });
    test('Array accessor methods', 11, function () {
        var l = new can.List([
                'a',
                'b',
                'c'
            ]), sliced = l.slice(2), joined = l.join(' | '), concatenated = l.concat([
                2,
                1
            ], new can.List([0]));
        ok(sliced instanceof can.List, 'Slice is an Observable list');
        equal(sliced.length, 1, 'Sliced off two elements');
        equal(sliced[0], 'c', 'Single element as expected');
        equal(joined, 'a | b | c', 'Joined list properly');
        ok(concatenated instanceof can.List, 'Concatenated is an Observable list');
        deepEqual(concatenated.serialize(), [
            'a',
            'b',
            'c',
            2,
            1,
            0
        ], 'List concatenated properly');
        l.forEach(function (letter, index) {
            ok(true, 'Iteration');
            if (index === 0) {
                equal(letter, 'a', 'First letter right');
            }
            if (index === 2) {
                equal(letter, 'c', 'Last letter right');
            }
        });
    });
    test('instantiating can.List of correct type', function () {
        var Ob = can.LazyMap({
            getName: function () {
                return this.attr('name');
            }
        });
        var list = new Ob.List([{ name: 'Tester' }]);
        equal(list.length, 1, 'List length is correct');
        ok(list[0] instanceof can.LazyMap, 'Initialized list item converted to can.LazyMap');
        ok(list[0] instanceof Ob, 'Initialized list item converted to Ob');
        equal(list[0].getName(), 'Tester', 'Converted to extended Map instance, could call getName()');
        list.push({ name: 'Another test' });
        equal(list[1].getName(), 'Another test', 'Pushed item gets converted as well');
    });
    test('can.List.prototype.splice converts objects (#253)', function () {
        var Ob = can.LazyMap({
            getAge: function () {
                return this.attr('age') + 10;
            }
        });
        var list = new Ob.List([
            {
                name: 'Tester',
                age: 23
            },
            {
                name: 'Tester 2',
                age: 44
            }
        ]);
        equal(list[0].getAge(), 33, 'Converted age');
        list.splice(1, 1, {
            name: 'Spliced',
            age: 92
        });
        equal(list[1].getAge(), 102, 'Converted age of spliced');
    });
    test('removing an already missing attribute does not cause an event', function () {
        expect(0);
        var ob = new can.LazyMap();
        ob.bind('change', function () {
            ok(false);
        });
        ob.removeAttr('foo');
    });
    test('Only plain objects should be converted to Observes', function () {
        var ob = new can.LazyMap();
        ob.attr('date', new Date());
        ok(ob.attr('date') instanceof Date, 'Date should not be converted');
        var selected = can.$('body');
        ob.attr('sel', selected);
        if (can.isArray(selected)) {
            ok(ob.attr('sel') instanceof can.List, 'can.$() as array converted into List');
        } else {
            equal(ob.attr('sel'), selected, 'can.$() should not be converted');
        }
        ob.attr('element', document.getElementsByTagName('body')[0]);
        equal(ob.attr('element'), document.getElementsByTagName('body')[0], 'HTMLElement should not be converted');
        ob.attr('window', window);
        equal(ob.attr('window'), window, 'Window object should not be converted');
    });
    test('bind on deep properties', function () {
        expect(2);
        var ob = new can.LazyMap({ name: { first: 'Brian' } });
        ob.bind('name.first', function (ev, newVal, oldVal) {
            equal(newVal, 'Justin');
            equal(oldVal, 'Brian');
        });
        ob.attr('name.first', 'Justin');
    });
    test('startBatch and stopBatch and changed event', 5, function () {
        var ob = new can.LazyMap({
                name: { first: 'Brian' },
                age: 29
            }), bothSet = false, changeCallCount = 0, changedCalled = false;
        ob.bind('change', function () {
            ok(bothSet, 'both properties are set before the changed event was called');
            ok(!changedCalled, 'changed not called yet');
            changeCallCount++;
        });
        stop();
        can.batch.start(function () {
            ok(true, 'batch callback called');
        });
        ob.attr('name.first', 'Justin');
        setTimeout(function () {
            ob.attr('age', 30);
            bothSet = true;
            can.batch.stop();
            start();
        }, 1);
    });
    test('startBatch callback', 4, function () {
        var ob = new can.LazyMap({
                game: { name: 'Legend of Zelda' },
                hearts: 15
            }), callbackCalled = false;
        ob.bind('change', function () {
            equal(callbackCalled, false, 'startBatch callback not called yet');
        });
        can.batch.start(function () {
            ok(true, 'startBatch callback called');
            callbackCalled = true;
        });
        ob.attr('hearts', 16);
        equal(callbackCalled, false, 'startBatch callback not called yet');
        can.batch.stop();
        equal(callbackCalled, true, 'startBatch callback called');
    });
    test('nested map attr', function () {
        var person1 = new can.LazyMap({ name: { first: 'Josh' } }), person2 = new can.LazyMap({
                name: {
                    first: 'Justin',
                    last: 'Meyer'
                }
            }), count = 0;
        person1.bind('change', function (ev, attr, how, val, old) {
            equal(count, 0, 'change called once');
            count++;
            equal(attr, 'name');
            equal(val.attr('first'), 'Justin');
            equal(val.attr('last'), 'Meyer');
        });
        person1.attr('name', person2.attr('name'));
        person1.attr('name', person2.attr('name'));
    });
    test('Nested array conversion (#172)', 4, function () {
        var original = [
                [
                    1,
                    2
                ],
                [
                    3,
                    4
                ],
                [
                    5,
                    6
                ]
            ], list = new can.List(original);
        equal(list.length, 3, 'list length is correct');
        deepEqual(list.serialize(), original, 'Lists are the same');
        list.unshift([
            10,
            11
        ], [
            12,
            13
        ]);
        ok(list[0] instanceof can.List, 'Unshifted array converted to map list');
        deepEqual(list.serialize(), [
            [
                10,
                11
            ],
            [
                12,
                13
            ]
        ].concat(original), 'Arrays unshifted properly');
    });
    test('can.List.prototype.replace (#194)', 7, function () {
        var list = new can.List([
                'a',
                'b',
                'c'
            ]), replaceList = [
                'd',
                'e',
                'f',
                'g'
            ], dfd = new can.Deferred();
        list.bind('remove', function (ev, arr) {
            equal(arr.length, 3, 'Three elements removed');
        });
        list.bind('add', function (ev, arr) {
            equal(arr.length, 4, 'Four new elements added');
        });
        list.replace(replaceList);
        deepEqual(list.serialize(), replaceList, 'Lists are the same');
        list.unbind('remove');
        list.unbind('add');
        list.replace();
        equal(list.length, 0, 'List has been emptied');
        list.push('D');
        stop();
        list.replace(dfd);
        setTimeout(function () {
            var newList = [
                'x',
                'y'
            ];
            list.bind('remove', function (ev, arr) {
                equal(arr.length, 1, 'One element removed');
            });
            list.bind('add', function (ev, arr) {
                equal(arr.length, 2, 'Two new elements added from Deferred');
            });
            dfd.resolve(newList);
            deepEqual(list.serialize(), newList, 'Lists are the same');
            start();
        }, 100);
    });
    test('replace with a deferred that resolves to an List', function () {
        var def = new can.Deferred();
        def.resolve(new can.List([
            { name: 'foo' },
            { name: 'bar' }
        ]));
        var list = new can.List([
            { name: '1' },
            { name: '2' }
        ]);
        list.bind('change', function () {
            equal(list.length, 2, 'length is still 2');
            equal(list[0].attr('name'), 'foo', 'set to foo');
        });
        list.replace(def);
    });
    test('.attr method doesn\'t merge nested objects (#207)', function () {
        var test = new can.LazyMap({
            a: {
                a1: 1,
                a2: 2
            },
            b: {
                b1: 1,
                b2: 2
            }
        });
        test.attr({
            a: { a2: 3 },
            b: { b1: 3 }
        });
        deepEqual(test.attr(), {
            'a': {
                'a1': 1,
                'a2': 3
            },
            'b': {
                'b1': 3,
                'b2': 2
            }
        }, 'Object merged as expected');
    });
    test('IE8 error on list setup with List (#226)', function () {
        var list = new can.List([
                'first',
                'second',
                'third'
            ]), otherList = new can.List(list);
        deepEqual(list.attr(), otherList.attr(), 'Lists are the same');
    });
    test('initialize List with a deferred', function () {
        stop();
        var def = new can.Deferred();
        var list = new can.List(def);
        list.bind('add', function (ev, items, index) {
            deepEqual(items, [
                'a',
                'b'
            ]);
            equal(index, 0);
            start();
        });
        setTimeout(function () {
            def.resolve([
                'a',
                'b'
            ]);
        }, 10);
    });
    test('triggering a event while in a batch (#291)', function () {
        expect(0);
        stop();
        var map = new can.LazyMap();
        can.batch.start();
        can.trigger(map, 'change', 'random');
        setTimeout(function () {
            can.batch.stop();
            start();
        }, 10);
    });
    test('dot separated keys (#257, #296)', 0, function () {
    });
    test('cycle binding', function () {
        var first = new can.LazyMap(), second = new can.LazyMap();
        first.attr('second', second);
        second.attr('first', second);
        var handler = function () {
        };
        first.bind('change', handler);
        ok(first._bindings, 'has bindings');
        first.unbind('change', handler);
        ok(!first._bindings, 'bindings removed');
    });
    test('Deferreds are not converted', function () {
        var dfd = can.Deferred(), ob = new can.LazyMap({ test: dfd });
        ok(can.isDeferred(ob.attr('test')), 'Attribute is a deferred');
        ok(!ob.attr('test')._cid, 'Does not have a _cid');
    });
    test('Setting property to undefined', function () {
        var ob = new can.LazyMap({ 'foo': 'bar' });
        ob.attr('foo', undefined);
        equal(ob.attr('foo'), undefined, 'foo has a value.');
    });
    test('removing list items containing computes', function () {
        var list = new can.List([{
                comp: can.compute(function () {
                    return false;
                })
            }]);
        list.pop();
        equal(list.length, 0, 'list is empty');
    });
    QUnit.module('can/map/lazy compute');
    test('Basic Compute', function () {
        var o = new can.LazyMap({
            first: 'Justin',
            last: 'Meyer'
        });
        var prop = can.compute(function () {
            return o.attr('first') + ' ' + o.attr('last');
        });
        equal(prop(), 'Justin Meyer');
        var handler = function (ev, newVal, oldVal) {
            equal(newVal, 'Brian Meyer');
            equal(oldVal, 'Justin Meyer');
        };
        prop.bind('change', handler);
        o.attr('first', 'Brian');
        prop.unbind('change', handler);
        o.attr('first', 'Brian');
    });
    test('compute on prototype', function () {
        var Person = can.LazyMap({
            fullName: function () {
                return this.attr('first') + ' ' + this.attr('last');
            }
        });
        var me = new Person({
            first: 'Justin',
            last: 'Meyer'
        });
        var fullName = can.compute(me.fullName, me);
        equal(fullName(), 'Justin Meyer');
        var called = 0;
        fullName.bind('change', function (ev, newVal, oldVal) {
            called++;
            equal(called, 1, 'called only once');
            equal(newVal, 'Justin Shah');
            equal(oldVal, 'Justin Meyer');
        });
        me.attr('last', 'Shah');
    });
    test('setter compute', function () {
        var project = new can.LazyMap({ progress: 0.5 });
        var computed = can.compute(function (val) {
            if (val) {
                project.attr('progress', val / 100);
            } else {
                return parseInt(project.attr('progress') * 100, 10);
            }
        });
        equal(computed(), 50, 'the value is right');
        computed(25);
        equal(project.attr('progress'), 0.25);
        equal(computed(), 25);
        computed.bind('change', function (ev, newVal, oldVal) {
            equal(newVal, 75);
            equal(oldVal, 25);
        });
        computed(75);
    });
    test('compute a compute', function () {
        var project = new can.LazyMap({ progress: 0.5 });
        var percent = can.compute(function (val) {
            if (val) {
                project.attr('progress', val / 100);
            } else {
                return parseInt(project.attr('progress') * 100, 10);
            }
        });
        percent.named = 'PERCENT';
        equal(percent(), 50, 'percent starts right');
        percent.bind('change', function () {
        });
        var fraction = can.compute(function (val) {
            if (val) {
                percent(parseInt(val.split('/')[0], 10));
            } else {
                return percent() + '/100';
            }
        });
        fraction.named = 'FRACTIOn';
        fraction.bind('change', function () {
        });
        equal(fraction(), '50/100', 'fraction starts right');
        percent(25);
        equal(percent(), 25);
        equal(project.attr('progress'), 0.25, 'progress updated');
        equal(fraction(), '25/100', 'fraction updated');
        fraction('15/100');
        equal(fraction(), '15/100');
        equal(project.attr('progress'), 0.15, 'progress updated');
        equal(percent(), 15, '% updated');
    });
    test('compute with a simple compute', function () {
        expect(4);
        var a = can.compute(5);
        var b = can.compute(function () {
            return a() * 2;
        });
        equal(b(), 10, 'b starts correct');
        a(3);
        equal(b(), 6, 'b updates');
        b.bind('change', function () {
            equal(b(), 24, 'b fires change');
        });
        a(12);
        equal(b(), 24, 'b updates when bound');
    });
    test('empty compute', function () {
        var c = can.compute();
        c.bind('change', function (ev, newVal, oldVal) {
            ok(oldVal === undefined, 'was undefined');
            ok(newVal === 0, 'now zero');
        });
        c(0);
    });
    test('only one update on a batchTransaction', function () {
        var person = new can.LazyMap({
            first: 'Justin',
            last: 'Meyer'
        });
        var func = can.compute(function () {
            return person.attr('first') + ' ' + person.attr('last') + Math.random();
        });
        var callbacks = 0;
        func.bind('change', function () {
            callbacks++;
        });
        person.attr({
            first: 'Brian',
            last: 'Moschel'
        });
        equal(callbacks, 1, 'only one callback');
    });
    test('only one update on a start and end transaction', function () {
        var person = new can.LazyMap({
                first: 'Justin',
                last: 'Meyer'
            }), age = can.compute(5);
        var func = can.compute(function (newVal, oldVal) {
            return person.attr('first') + ' ' + person.attr('last') + age() + Math.random();
        });
        var callbacks = 0;
        func.bind('change', function () {
            callbacks++;
        });
        can.batch.start();
        person.attr('first', 'Brian');
        stop();
        setTimeout(function () {
            person.attr('last', 'Moschel');
            age(12);
            can.batch.stop();
            equal(callbacks, 1, 'only one callback');
            start();
        });
    });
    test('Compute emits change events when an embbedded observe has properties added or removed', 4, function () {
        var obs = new can.LazyMap(), compute1 = can.compute(function () {
                var txt = obs.attr('foo');
                obs.each(function (val) {
                    txt += val.toString();
                });
                return txt;
            });
        compute1.bind('change', function (ev, newVal, oldVal) {
            ok(true, 'change handler fired: ' + newVal);
        });
        obs.attr('foo', 1);
        obs.attr('bar', 2);
        obs.attr('foo', 3);
        obs.removeAttr('bar');
        obs.removeAttr('bar');
    });
    test('compute only updates once when a list\'s contents are replaced', function () {
        var list = new can.List([{ name: 'Justin' }]), computedCount = 0;
        var compute = can.compute(function () {
            computedCount++;
            list.each(function (item) {
                item.attr('name');
            });
        });
        equal(0, computedCount, 'computes are not called until their value is read');
        compute.bind('change', function (ev, newVal, oldVal) {
        });
        equal(1, computedCount, 'binding computes to store the value');
        list.replace([{ name: 'hank' }]);
        equal(2, computedCount, 'only one compute');
    });
    test('Generate computes from Observes with can.LazyMap.prototype.compute (#203)', 6, function () {
        var obs = new can.LazyMap({ test: 'testvalue' });
        var compute = obs.compute('test');
        ok(compute.isComputed, '`test` is computed');
        equal(compute(), 'testvalue', 'Value is as expected');
        obs.attr('test', 'observeValue');
        equal(compute(), 'observeValue', 'Value is as expected');
        compute.bind('change', function (ev, newVal) {
            equal(newVal, 'computeValue', 'new value from compute');
        });
        obs.bind('change', function (ev, name, how, newVal) {
            equal(newVal, 'computeValue', 'Got new value from compute');
        });
        compute('computeValue');
        equal(compute(), 'computeValue', 'Got updated value');
    });
    test('compute of computes', function () {
        expect(2);
        var suggestedSearch = can.compute(null), searchQuery = can.compute(''), searchText = can.compute(function () {
                var suggested = suggestedSearch();
                if (suggested) {
                    return suggested;
                } else {
                    return searchQuery();
                }
            });
        equal('', searchText(), 'inital set');
        searchText.bind('change', function (ev, newVal) {
            equal(newVal, 'food', 'food set');
        });
        searchQuery('food');
    });
    test('compute doesn\'t rebind and leak with 0 bindings', function () {
        var state = new can.LazyMap({ foo: 'bar' });
        var computedA = 0, computedB = 0;
        var computeA = can.compute(function () {
            computedA++;
            return state.attr('foo') === 'bar';
        });
        var computeB = can.compute(function () {
            computedB++;
            return state.attr('foo') === 'bar' || 15;
        });
        function aChange(ev, newVal) {
            if (newVal) {
                computeB.bind('change.computeA', function () {
                });
            } else {
                computeB.unbind('change.computeA');
            }
        }
        computeA.bind('change', aChange);
        aChange(null, computeA());
        equal(computedA, 1, 'binding A computes the value');
        equal(computedB, 1, 'A=true, so B is bound, computing the value');
        state.attr('foo', 'baz');
        equal(computedA, 2, 'A recomputed and unbound B');
        equal(computedB, 1, 'B was unbound, so not recomputed');
        state.attr('foo', 'bar');
        equal(computedA, 3, 'A recomputed => true');
        equal(computedB, 2, 'A=true so B is rebound and recomputed');
        computeA.unbind('change', aChange);
        computeB.unbind('change.computeA');
        state.attr('foo', 'baz');
        equal(computedA, 3, 'unbound, so didn\'t recompute A');
        equal(computedB, 2, 'unbound, so didn\'t recompute B');
    });
    test('compute setter without external value', function () {
        var age = can.compute(0, function (newVal, oldVal) {
            var num = +newVal;
            if (!isNaN(num) && 0 <= num && num <= 120) {
                return num;
            } else {
                return oldVal;
            }
        });
        equal(age(), 0, 'initial value set');
        age.bind('change', function (ev, newVal, oldVal) {
            equal(5, newVal);
            age.unbind('change', this.Constructor);
        });
        age(5);
        equal(age(), 5, '5 set');
        age('invalid');
        equal(age(), 5, '5 kept');
    });
    test('compute value', function () {
        expect(9);
        var input = { value: 1 };
        var value = can.compute('', {
            get: function () {
                return input.value;
            },
            set: function (newVal) {
                input.value = newVal;
            },
            on: function (update) {
                input.onchange = update;
            },
            off: function () {
                delete input.onchange;
            }
        });
        equal(value(), 1, 'original value');
        ok(!input.onchange, 'nothing bound');
        value(2);
        equal(value(), 2, 'updated value');
        equal(input.value, 2, 'updated input.value');
        value.bind('change', function (ev, newVal, oldVal) {
            equal(newVal, 3, 'newVal');
            equal(oldVal, 2, 'oldVal');
            value.unbind('change', this.Constructor);
        });
        ok(input.onchange, 'binding to onchange');
        value(3);
        ok(!input.onchange, 'removed binding');
        equal(value(), 3);
    });
    test('compute bound to observe', function () {
        var me = new can.LazyMap({ name: 'Justin' });
        var bind = me.bind, unbind = me.unbind, bindCount = 0;
        me.bind = function () {
            bindCount++;
            bind.apply(this, arguments);
        };
        me.unbind = function () {
            bindCount--;
            unbind.apply(this, arguments);
        };
        var name = can.compute(me, 'name');
        equal(bindCount, 0);
        equal(name(), 'Justin');
        var handler = function (ev, newVal, oldVal) {
            equal(newVal, 'Justin Meyer');
            equal(oldVal, 'Justin');
        };
        name.bind('change', handler);
        equal(bindCount, 1);
        name.unbind('change', handler);
        stop();
        setTimeout(function () {
            start();
            equal(bindCount, 0);
        }, 100);
    });
    test('binding to a compute on an observe before reading', function () {
        var me = new can.LazyMap({ name: 'Justin' });
        var name = can.compute(me, 'name');
        var handler = function (ev, newVal, oldVal) {
            equal(newVal, 'Justin Meyer');
            equal(oldVal, 'Justin');
        };
        name.bind('change', handler);
        equal(name(), 'Justin');
    });
    test('compute bound to input value', function () {
        var input = document.createElement('input');
        input.value = 'Justin';
        var value = can.compute(input, 'value', 'change');
        equal(value(), 'Justin');
        value('Justin M.');
        equal(input.value, 'Justin M.', 'input change correctly');
        var handler = function (ev, newVal, oldVal) {
            equal(newVal, 'Justin Meyer');
            equal(oldVal, 'Justin M.');
        };
        value.bind('change', handler);
        input.value = 'Justin Meyer';
        value.unbind('change', handler);
        stop();
        setTimeout(function () {
            input.value = 'Brian Moschel';
            equal(value(), 'Brian Moschel');
            start();
        }, 50);
    });
    test('compute on the prototype', function () {
        expect(4);
        var Person = can.LazyMap.extend({
            fullName: can.compute(function (fullName) {
                if (arguments.length) {
                    var parts = fullName.split(' ');
                    this.attr({
                        first: parts[0],
                        last: parts[1]
                    });
                } else {
                    return this.attr('first') + ' ' + this.attr('last');
                }
            })
        });
        var me = new Person();
        var fn = me.attr({
            first: 'Justin',
            last: 'Meyer'
        }).attr('fullName');
        equal(fn, 'Justin Meyer', 'can read attr');
        me.attr('fullName', 'Brian Moschel');
        equal(me.attr('first'), 'Brian', 'set first name');
        equal(me.attr('last'), 'Moschel', 'set last name');
        var handler = function (ev, newVal, oldVal) {
            ok(newVal, 'Brian M');
        };
        me.bind('fullName', handler);
        me.attr('last', 'M');
        me.unbind('fullName', handler);
        me.attr('first', 'B');
    });
    test('join is computable (#519)', function () {
        expect(2);
        var l = new can.List([
            'a',
            'b'
        ]);
        var joined = can.compute(function () {
            return l.join(',');
        });
        joined.bind('change', function (ev, newVal, oldVal) {
            equal(oldVal, 'a,b');
            equal(newVal, 'a,b,c');
        });
        l.push('c');
    });
    test('nested computes', function () {
        var data = new can.LazyMap({});
        var compute = data.compute('summary.button');
        compute.bind('change', function () {
            ok(true, 'compute changed');
        });
        data.attr({ summary: { button: 'hey' } }, true);
    });
});
/*can@2.3.18#map/lazy/list_test.js*/
define('can/map/lazy/list_test.js', function (require, exports, module) {
    var can = require('can/util/util');
    require('steal-qunit');
    QUnit.module('can/list/lazy');
    test('list attr changes length', function () {
        var l = new can.LazyList([
            0,
            1,
            2
        ]);
        l.attr(3, 3);
        equal(l.length, 4);
    });
    test('list splice', function () {
        var l = new can.LazyList([
                0,
                1,
                2,
                3
            ]), first = true;
        l.bind('change', function (ev, attr, how, newVals, oldVals) {
            equal(attr, '1');
            if (first) {
                equal(how, 'remove', 'removing items');
                equal(newVals, undefined, 'no new Vals');
            } else {
                deepEqual(newVals, [
                    'a',
                    'b'
                ], 'got the right newVals');
                equal(how, 'add', 'adding items');
            }
            first = false;
        });
        l.splice(1, 2, 'a', 'b');
        deepEqual(l.serialize(), [
            0,
            'a',
            'b',
            3
        ], 'serialized');
    });
    test('list pop', function () {
        var l = new can.LazyList([
            0,
            1,
            2,
            3
        ]);
        l.bind('change', function (ev, attr, how, newVals, oldVals) {
            equal(attr, '3');
            equal(how, 'remove');
            equal(newVals, undefined);
            deepEqual(oldVals, [3]);
        });
        l.pop();
        deepEqual(l.serialize(), [
            0,
            1,
            2
        ]);
    });
    test('remove nested property in item of array map', function () {
        var state = new can.LazyList([{ nested: true }]);
        state.bind('change', function (ev, attr, how, newVal, old) {
            equal(attr, '0.nested');
            equal(how, 'remove');
            deepEqual(old, true);
        });
        state.removeAttr('0.nested');
        equal(undefined, state.attr('0.nested'));
    });
    test('pop unbinds', 4, function () {
        var l = new can.LazyList([{ foo: 'bar' }]);
        var o = l.attr(0), count = 0;
        l.bind('change', function (ev, attr, how, newVal, oldVal) {
            count++;
            if (count === 1) {
                equal(attr, '0.foo', 'count is set');
            } else if (count === 2) {
                equal(how, 'remove');
                equal(attr, '0');
            } else {
                ok(false, 'called too many times');
            }
        });
        equal(o.attr('foo'), 'bar');
        o.attr('foo', 'car');
        l.pop();
        o.attr('foo', 'bad');
    });
    test('splice unbinds', 4, function () {
        var l = new can.LazyList([{ foo: 'bar' }]);
        var o = l.attr(0), count = 0;
        l.bind('change', function (ev, attr, how, newVal, oldVal) {
            count++;
            if (count === 1) {
                equal(attr, '0.foo', 'count is set');
            } else if (count === 2) {
                equal(how, 'remove');
                equal(attr, '0');
            } else {
                ok(false, 'called too many times');
            }
        });
        equal(o.attr('foo'), 'bar');
        o.attr('foo', 'car');
        l.splice(0, 1);
        o.attr('foo', 'bad');
    });
    test('always gets right attr even after moving array items', function () {
        var l = new can.LazyList([{ foo: 'bar' }]);
        var o = l.attr(0);
        l.unshift('A new Value');
        l.bind('change', function (ev, attr, how) {
            equal(attr, '1.foo');
        });
        o.attr('foo', 'led you');
    });
    test('Array accessor methods', 11, function () {
        var l = new can.LazyList([
                'a',
                'b',
                'c'
            ]), sliced = l.slice(2), joined = l.join(' | '), concatenated = l.concat([
                2,
                1
            ], new can.LazyList([0]));
        ok(sliced instanceof can.LazyList, 'Slice is an Observable list');
        equal(sliced.length, 1, 'Sliced off two elements');
        equal(sliced[0], 'c', 'Single element as expected');
        equal(joined, 'a | b | c', 'Joined list properly');
        ok(concatenated instanceof can.LazyList, 'Concatenated is an Observable list');
        deepEqual(concatenated.serialize(), [
            'a',
            'b',
            'c',
            2,
            1,
            0
        ], 'List concatenated properly');
        l.forEach(function (letter, index) {
            ok(true, 'Iteration');
            if (index === 0) {
                equal(letter, 'a', 'First letter right');
            }
            if (index === 2) {
                equal(letter, 'c', 'Last letter right');
            }
        });
    });
    test('splice removes items in IE (#562)', function () {
        var l = new can.LazyList(['a']);
        l.splice(0, 1);
        ok(!l.attr(0), 'all props are removed');
    });
});
/*map/lazy/lazy_test*/
define('can/map/lazy/lazy_test', function (require, exports, module) {
    require('steal-qunit');
    require('can/map/lazy/nested_reference_test.js');
    require('can/map/lazy/map_test.js');
    require('can/map/lazy/observe_test.js');
    require('can/map/lazy/list_test.js');
});
/*map/delegate/delegate_test*/
define('can/map/delegate/delegate_test', function (require, exports, module) {
    var can = require('can/util/util');
    require('can/list/list');
    require('can/map/delegate/delegate');
    require('steal-qunit');
    QUnit.module('can/map/delegate');
    var matches = can.Map.prototype.delegate.matches;
    test('matches', function () {
        equal(matches(['**'], [
            'foo',
            'bar',
            '0'
        ]), 'foo.bar.0', 'everything');
        equal(matches(['*.**'], ['foo']), null, 'everything at least one level deep');
        equal(matches([
            'foo',
            '*'
        ], [
            'foo',
            'bar',
            '0'
        ]), 'foo.bar');
        equal(matches(['*'], [
            'foo',
            'bar',
            '0'
        ]), 'foo');
        equal(matches([
            '*',
            'bar'
        ], [
            'foo',
            'bar',
            '0'
        ]), 'foo.bar');
    });
    test('delegate', 4, function () {
        var state = new can.Map({ properties: { prices: [] } });
        var prices = state.attr('properties.prices');
        state.delegate('properties.prices', 'change', function (ev, attr, how, val, old) {
            equal(attr, '0', 'correct change name');
            equal(how, 'add');
            equal(val[0].attr('foo'), 'bar', 'correct');
            ok(this === prices, 'rooted element');
        });
        prices.push({ foo: 'bar' });
        state.undelegate();
    });
    test('delegate on add', 2, function () {
        var state = new can.Map({});
        state.delegate('foo', 'add', function (ev, newVal) {
            ok(true, 'called');
            equal(newVal, 'bar', 'got newVal');
        }).delegate('foo', 'remove', function () {
            ok(false, 'remove should not be called');
        });
        state.attr('foo', 'bar');
    });
    test('delegate set is called on add', 2, function () {
        var state = new can.Map({});
        state.delegate('foo', 'set', function (ev, newVal) {
            ok(true, 'called');
            equal(newVal, 'bar', 'got newVal');
        });
        state.attr('foo', 'bar');
    });
    test('delegate\'s this', 5, function () {
        var state = new can.Map({
            person: {
                name: {
                    first: 'justin',
                    last: 'meyer'
                }
            },
            prop: 'foo'
        });
        var n = state.attr('person.name'), check;
        state.delegate('person.name', 'set', check = function (ev, newValue, oldVal, from) {
            equal(this, n);
            equal(newValue, 'Brian');
            equal(oldVal, 'justin');
            equal(from, 'first');
        });
        n.attr('first', 'Brian');
        state.undelegate('person.name', 'set', check);
        state.delegate('prop', 'set', function () {
            equal(this, 'food');
        });
        state.attr('prop', 'food');
    });
    test('delegate on deep properties with *', function () {
        var state = new can.Map({
            person: {
                name: {
                    first: 'justin',
                    last: 'meyer'
                }
            }
        });
        state.delegate('person', 'set', function (ev, newVal, oldVal, attr) {
            equal(this, state.attr('person'), 'this is set right');
            equal(attr, 'name.first');
        });
        state.attr('person.name.first', 'brian');
    });
    test('compound sets', function () {
        var state = new can.Map({
            type: 'person',
            id: '5'
        });
        var count = 0;
        state.delegate('type=person id', 'set', function () {
            equal(state.type, 'person', 'type is person');
            ok(state.id !== undefined, 'id has value');
            count++;
        });
        state.attr('id', 0);
        equal(count, 1, 'changing the id to 0 caused a change');
        state.removeAttr('id');
        equal(count, 1, 'removing the id changed nothing');
        state.attr('id', 3);
        equal(count, 2, 'adding an id calls callback');
        state.attr('type', 'peter');
        equal(count, 2, 'changing the type does not fire callback');
        state.removeAttr('type');
        state.removeAttr('id');
        equal(count, 2, '');
        state.attr({
            type: 'person',
            id: '5'
        });
        equal(count, 3, 'setting person and id only fires 1 event');
        state.removeAttr('type');
        state.removeAttr('id');
        state.attr({ type: 'person' });
        equal(count, 3, 'setting person does not fire anything');
    });
    test('undelegate within event loop', 1, function () {
        var state = new can.Map({
            type: 'person',
            id: '5'
        });
        var f1 = function () {
                state.undelegate('type', 'add', f2);
            }, f2 = function () {
                ok(false, 'I am removed, how am I called');
            }, f3 = function () {
                state.undelegate('type', 'add', f1);
            }, f4 = function () {
                ok(true, 'f4 called');
            };
        state.delegate('type', 'set', f1);
        state.delegate('type', 'set', f2);
        state.delegate('type', 'set', f3);
        state.delegate('type', 'set', f4);
        state.attr('type', 'other');
    });
    test('selector types', 5, function () {
        var state = new can.Map({
            foo: 'a',
            bar: 'b',
            baz: 'c',
            box: 'd',
            baw: 'e'
        });
        state.delegate('foo=aa', 'change', function () {
            ok(true, 'Unquoted value in selector matched.');
        });
        state.attr({ foo: 'aa' });
        state.delegate('bar=\'b b\'', 'change', function () {
            ok(true, 'Single-quoted value in selector matched.');
        });
        state.attr({ bar: 'b b' });
        state.delegate('baz="c c"', 'change', function () {
            ok(true, 'Double-quoted value in selector matched.');
        });
        state.attr({ baz: 'c c' });
        state.delegate('box', 'change', function () {
            ok(true, 'No-value attribute in selector matched.');
        });
        state.attr({ box: 'quux' });
        state.delegate('baw=', 'change', function () {
            ok(true, 'Empty-value shortcut in selector matched.');
        });
        state.attr({ baw: '' });
    });
});
/*map/setter/setter_test*/
define('can/map/setter/setter_test', function (require, exports, module) {
    var can = require('can/util/util');
    require('can/map/setter/setter');
    require('steal-qunit');
    QUnit.module('can/map/setter');
    test('setter testing works', function () {
        var Contact = can.Map({
            setBirthday: function (raw) {
                if (typeof raw === 'number') {
                    return new Date(raw);
                } else if (raw instanceof Date) {
                    return raw;
                }
            }
        });
        var date = new Date(), contact = new Contact({ birthday: date.getTime() });
        equal(contact.birthday.getTime(), date.getTime(), 'set as birthday');
        date = new Date();
        contact.attr('birthday', date.getTime());
        equal(contact.birthday.getTime(), date.getTime(), 'set via attr');
        date = new Date();
        contact.attr({ birthday: date.getTime() });
        equal(contact.birthday.getTime(), date.getTime(), 'set as birthday');
    });
    test('error binding', 1, function () {
        can.Map('School', {
            setName: function (name, success, error) {
                if (!name) {
                    error('no name');
                }
                return error;
            }
        });
        var school = new School();
        school.bind('error', function (ev, attr, error) {
            equal(error, 'no name', 'error message provided');
        });
        school.attr('name', '');
    });
    test('asyncronous setting', function () {
        var Meyer = can.Map({
            setName: function (newVal, success) {
                setTimeout(function () {
                    success(newVal + ' Meyer');
                }, 1);
            }
        });
        stop();
        var me = new Meyer();
        me.bind('name', function (ev, newVal) {
            equal(newVal, 'Justin Meyer');
            equal(me.attr('name'), 'Justin Meyer');
            start();
        });
        me.attr('name', 'Justin');
    });
    test('setter function values are automatically batched (#815)', function () {
        var Mapped = can.Map.extend({
            setFoo: function (newValue) {
                this.attr('zed', 'ted');
                return newValue;
            }
        });
        var map = new Mapped(), batchNum;
        map.bind('zed', function (ev) {
            batchNum = ev.batchNum;
            ok(batchNum, 'zed event is batched');
        });
        map.bind('foo', function (ev) {
            equal(batchNum, ev.batchNum, 'batchNums are the same');
        });
        map.attr('foo', 'bar');
    });
});
/*map/validations/validations_test*/
define('can/map/validations/validations_test', function (require, exports, module) {
    var can = require('can/util/util');
    require('can/map/validations/validations');
    require('can/compute/compute');
    require('steal-qunit');
    QUnit.module('can/map/validations', {
        setup: function () {
            can.Map.extend('Person', {}, {});
        }
    });
    test('observe can validate, events, callbacks', 7, function () {
        Person.validate('age', { message: 'it\'s a date type' }, function (val) {
            return !(this.date instanceof Date);
        });
        var task = new Person({ age: 'bad' }), errors = task.errors();
        ok(errors, 'There are errors');
        equal(errors.age.length, 1, 'there is one error');
        equal(errors.age[0], 'it\'s a date type', 'error message is right');
        task.bind('error', function (ev, attr, errs) {
            ok(this === task, 'we get task back by binding');
            ok(errs, 'There are errors');
            equal(errs.age.length, 1, 'there is one error');
            equal(errs.age[0], 'it\'s a date type', 'error message is right');
        });
        task.attr('age', 'blah');
        task.unbind('error');
        task.attr('age', 'blaher');
    });
    test('validatesFormatOf', function () {
        Person.validateFormatOf('thing', /\d-\d/);
        ok(!new Person({ thing: '1-2' }).errors(), 'no errors');
        var errors = new Person({ thing: 'foobar' }).errors();
        ok(errors, 'there are errors');
        equal(errors.thing.length, 1, 'one error on thing');
        equal(errors.thing[0], 'is invalid', 'basic message');
        Person.validateFormatOf('otherThing', /\d/, { message: 'not a digit' });
        var errors2 = new Person({
            thing: '1-2',
            otherThing: 'a'
        }).errors();
        equal(errors2.otherThing[0], 'not a digit', 'can supply a custom message');
        ok(!new Person({
            thing: '1-2',
            otherThing: null
        }).errors(), 'can handle null');
        ok(!new Person({ thing: '1-2' }).errors(), 'can handle undefiend');
    });
    test('validatesInclusionOf', function () {
        Person.validateInclusionOf('thing', [
            'yes',
            'no',
            'maybe'
        ]);
        ok(!new Person({ thing: 'yes' }).errors(), 'no errors');
        var errors = new Person({ thing: 'foobar' }).errors();
        ok(errors, 'there are errors');
        equal(errors.thing.length, 1, 'one error on thing');
        equal(errors.thing[0], 'is not a valid option (perhaps out of range)', 'basic message');
        Person.validateInclusionOf('otherThing', [
            'yes',
            'no',
            'maybe'
        ], { message: 'not a valid option' });
        var errors2 = new Person({
            thing: 'yes',
            otherThing: 'maybe not'
        }).errors();
        equal(errors2.otherThing[0], 'not a valid option', 'can supply a custom message');
    });
    test('validatesLengthOf', function () {
        Person.validateLengthOf('undefinedValue', 0, 5);
        Person.validateLengthOf('nullValue', 0, 5);
        Person.validateLengthOf('thing', 2, 5);
        ok(!new Person({
            thing: 'yes',
            nullValue: null
        }).errors(), 'no errors');
        var errors = new Person({ thing: 'foobar' }).errors();
        ok(errors, 'there are errors');
        equal(errors.thing.length, 1, 'one error on thing');
        equal(errors.thing[0], 'is too long (max=5)', 'basic message');
        Person.validateLengthOf('otherThing', 2, 5, { message: 'invalid length' });
        var errors2 = new Person({
            thing: 'yes',
            otherThing: 'too long'
        }).errors();
        equal(errors2.otherThing[0], 'invalid length', 'can supply a custom message');
        Person.validateLengthOf('undefinedValue2', 1, 5);
        Person.validateLengthOf('nullValue2', 1, 5);
        var errors3 = new Person({
            thing: 'yes',
            nullValue2: null
        }).errors();
        equal(errors3.undefinedValue2.length, 1, 'can handle undefined');
        equal(errors3.nullValue2.length, 1, 'can handle null');
    });
    test('validatesPresenceOf', function () {
        can.Map.extend('Task', {
            init: function () {
                this.validatePresenceOf('dueDate');
            }
        }, {});
        var task = new Task(), errors = task.errors();
        ok(errors);
        ok(errors.dueDate);
        equal(errors.dueDate[0], 'can\'t be empty', 'right message');
        task = new Task({ dueDate: null });
        errors = task.errors();
        ok(errors);
        ok(errors.dueDate);
        equal(errors.dueDate[0], 'can\'t be empty', 'right message');
        task = new Task({ dueDate: '' });
        errors = task.errors();
        ok(errors);
        ok(errors.dueDate);
        equal(errors.dueDate[0], 'can\'t be empty', 'right message');
        task = new Task({ dueDate: 'yes' });
        errors = task.errors();
        ok(!errors, 'no errors ' + typeof errors);
        can.Map.extend('Task', {
            init: function () {
                this.validatePresenceOf('dueDate', { message: 'You must have a dueDate' });
            }
        }, {});
        task = new Task({ dueDate: 'yes' });
        errors = task.errors();
        ok(!errors, 'no errors ' + typeof errors);
    });
    test('validatesPresenceOf with numbers and a 0 value', function () {
        can.Map.extend('Person', { attributes: { age: 'number' } });
        Person.validatePresenceOf('age');
        var person = new Person();
        var errors = person.errors();
        ok(errors);
        ok(errors.age);
        equal(errors.age[0], 'can\'t be empty', 'A new Person with no age generates errors.');
        person = new Person({ age: null });
        errors = person.errors();
        ok(errors);
        ok(errors.age);
        equal(errors.age[0], 'can\'t be empty', 'A new Person with null age generates errors.');
        person = new Person({ age: '' });
        errors = person.errors();
        ok(errors);
        ok(errors.age);
        equal(errors.age[0], 'can\'t be empty', 'A new Person with an empty string age generates errors.');
        person = new Person({ age: 12 });
        errors = person.errors();
        ok(!errors, 'A new Person with a valid >0 age doesn\'t generate errors.');
        person = new Person({ age: 0 });
        errors = person.errors();
        ok(!errors, 'A new Person with a valid 0 age doesn\'t generate errors');
    });
    test('validatesRangeOf', function () {
        Person.validateRangeOf('thing', 2, 5);
        Person.validateRangeOf('nullValue', 0, 5);
        Person.validateRangeOf('undefinedValue', 0, 5);
        ok(!new Person({
            thing: 4,
            nullValue: null
        }).errors(), 'no errors');
        var errors = new Person({ thing: 6 }).errors();
        ok(errors, 'there are errors');
        equal(errors.thing.length, 1, 'one error on thing');
        equal(errors.thing[0], 'is out of range [2,5]', 'basic message');
        Person.validateRangeOf('otherThing', 2, 5, { message: 'value out of range' });
        var errors2 = new Person({
            thing: 4,
            otherThing: 6
        }).errors();
        equal(errors2.otherThing[0], 'value out of range', 'can supply a custom message');
        Person.validateRangeOf('nullValue2', 1, 5);
        Person.validateRangeOf('undefinedValue2', 1, 5);
        var errors3 = new Person({
            thing: 2,
            nullValue2: null
        }).errors();
        equal(errors3.nullValue2.length, 1, 'one error on nullValue2');
        equal(errors3.undefinedValue2.length, 1, 'one error on undefinedValue2');
    });
    test('validatesNumericalityOf', function () {
        Person.validatesNumericalityOf(['foo']);
        var errors;
        errors = new Person({ foo: 0 }).errors();
        ok(!errors, 'no errors');
        errors = new Person({ foo: 1 }).errors();
        ok(!errors, 'no errors');
        errors = new Person({ foo: 1.5 }).errors();
        ok(!errors, 'no errors');
        errors = new Person({ foo: -1.5 }).errors();
        ok(!errors, 'no errors');
        errors = new Person({ foo: '1' }).errors();
        ok(!errors, 'no errors');
        errors = new Person({ foo: '1.5' }).errors();
        ok(!errors, 'no errors');
        errors = new Person({ foo: '.5' }).errors();
        ok(!errors, 'no errors');
        errors = new Person({ foo: '-1.5' }).errors();
        ok(!errors, 'no errors');
        errors = new Person({ foo: ' ' }).errors();
        equal(errors.foo.length, 1, 'one error on foo');
        errors = new Person({ foo: '1f' }).errors();
        equal(errors.foo.length, 1, 'one error on foo');
        errors = new Person({ foo: 'f1' }).errors();
        equal(errors.foo.length, 1, 'one error on foo');
        errors = new Person({ foo: '1.5.5' }).errors();
        equal(errors.foo.length, 1, 'one error on foo');
        errors = new Person({ foo: '\t\t' }).errors();
        equal(errors.foo.length, 1, 'one error on foo');
        errors = new Person({ foo: '\n\r' }).errors();
        equal(errors.foo.length, 1, 'one error on foo');
    });
    test('Validate with compute (#410)', function () {
        expect(4);
        Person.validate('age', { message: 'it\'s a date type' }, function (val) {
            return !(this.date instanceof Date);
        });
        var task = new Person({ age: 20 }), errors = can.compute(function () {
                return task.errors();
            });
        errors.bind('change', function (ev, errorObj) {
            equal(errorObj.age.length, 1, 'there is one error');
            equal(errorObj.age.length, 1, 'there is one error');
        });
        task.attr('age', 'bad');
        task.attr('age', 'still bad');
    });
    test('Validate undefined property', function () {
        new can.Map().errors('foo');
        ok(true, 'does not throw');
    });
});
/*map/backup/backup_test*/
define('can/map/backup/backup_test', function (require, exports, module) {
    var can = require('can/util/util');
    require('can/map/backup/backup');
    require('can/model/model');
    require('steal-qunit');
    QUnit.module('can/map/backup', {
        setup: function () {
            can.Map.extend('Recipe');
        }
    });
    test('backing up', function () {
        var recipe = new Recipe({ name: 'cheese' });
        ok(!recipe.isDirty(), 'not backedup, but clean');
        recipe.backup();
        ok(!recipe.isDirty(), 'backedup, but clean');
        recipe.attr('name', 'blah');
        ok(recipe.isDirty(), 'dirty');
        recipe.restore();
        ok(!recipe.isDirty(), 'restored, clean');
        equal(recipe.name, 'cheese', 'name back');
    });
    test('backup / restore with associations', function () {
        can.Map('Instruction');
        can.Map('Cookbook');
        can.Map('Recipe', {
            attributes: {
                instructions: 'Instruction.models',
                cookbook: 'Cookbook.model'
            }
        }, {});
        var recipe = new Recipe({
            name: 'cheese burger',
            instructions: [
                { description: 'heat meat' },
                { description: 'add cheese' }
            ],
            cookbook: { title: 'Justin\'s Grillin Times' }
        });
        ok(!recipe.isDirty(), 'not backedup, but clean');
        recipe.backup();
        ok(!recipe.isDirty(), 'backedup, but clean');
        recipe.attr('name', 'blah');
        ok(recipe.isDirty(), 'dirty');
        recipe.restore();
        ok(!recipe.isDirty(), 'restored, clean');
        equal(recipe.name, 'cheese burger', 'name back');
        ok(!recipe.cookbook.isDirty(), 'cookbook not backedup, but clean');
        recipe.cookbook.backup();
        recipe.cookbook.attr('title', 'Brian\'s Burgers');
        ok(!recipe.isDirty(), 'recipe itself is clean');
        ok(recipe.isDirty(true), 'recipe is dirty if checking associations');
        recipe.cookbook.restore();
        ok(!recipe.isDirty(true), 'recipe is now clean with checking associations');
        equal(recipe.cookbook.title, 'Justin\'s Grillin Times', 'cookbook title back');
        recipe.cookbook.attr('title', 'Brian\'s Burgers');
        recipe.restore();
        ok(recipe.isDirty(true), 'recipe is dirty if checking associations, after a restore');
        recipe.restore(true);
        ok(!recipe.isDirty(true), 'cleaned all of recipe and its associations');
    });
    test('backup restore nested observables', function () {
        var observe = new can.Map({ nested: { test: 'property' } });
        equal(observe.attr('nested').attr('test'), 'property', 'Nested object got converted');
        observe.backup();
        observe.attr('nested').attr('test', 'changed property');
        equal(observe.attr('nested').attr('test'), 'changed property', 'Nested property changed');
        ok(observe.isDirty(true), 'Observe is dirty');
        observe.restore(true);
        equal(observe.attr('nested').attr('test'), 'property', 'Nested object got restored');
    });
    test('backup removes properties that were added (#607)', function () {
        var map = new can.Map({});
        map.backup();
        map.attr('foo', 'bar');
        ok(map.isDirty(), 'the map with an additional property is dirty');
        map.restore();
        ok(!map.attr('foo'), 'there is no foo property');
    });
    test('isDirty wrapped in a compute should trigger changes #1417', function () {
        expect(2);
        var recipe = new Recipe({ name: 'bread' });
        recipe.backup();
        var c = can.compute(function () {
            return recipe.isDirty();
        });
        ok(!c(), 'isDirty is false');
        c.bind('change', function () {
            ok(c(), 'isDirty is true and a change has occurred');
        });
        recipe.attr('name', 'cheese');
    });
});
/*map/list/list_test*/
define('can/map/list/list_test', function (require, exports, module) {
    var can = require('can/util/util');
    require('can/map/list/list');
    require('steal-qunit');
    QUnit.module('can/map/list');
    test('filter', 8, function () {
        var original = new can.List([
            {
                name: 'Test 1',
                age: 20
            },
            {
                name: 'Test 2',
                age: 80
            },
            {
                name: 'Test 3',
                age: 1
            },
            {
                name: 'Test 4',
                age: 21
            }
        ]);
        var state = new can.Map({ minAge: 20 });
        var filtered = original.filter(function (element) {
            return element.attr('age') > state.attr('minAge');
        });
        original.attr('0.age', 22);
        equal(filtered.length, 3, 'Updating age adds a new item to filtered list');
        equal(filtered[filtered.length - 1].attr('age'), 22, 'Item has updated age');
        original.attr('1.age', 18);
        equal(filtered.length, 2, 'Updating age removes existing item from filtered list');
        state.attr('minAge', 80);
        original.attr('1.age', 87);
        equal(filtered.length, 1, 'Filtered list has one item');
        equal(filtered[0].attr('age'), 87, 'Contains single item with udpated age');
        state.attr('minAge', 29);
        original.push({
            name: 'Pushed tester',
            age: 28
        }, {
            name: 'Pushed tester 2',
            age: 30
        });
        equal(filtered.length, 2, 'Newly pushed element got updated according to filter');
        original.pop();
        equal(filtered.length, 1, 'Removed element also removed from filter');
        equal(filtered[0].attr('name'), 'Test 2', 'Older element remains');
    });
    test('attr updates items in position order', function () {
        var original = new can.List([
            {
                id: 1,
                name: 'Test 1',
                age: 20
            },
            {
                id: 2,
                name: 'Test 2',
                age: 80
            },
            {
                id: 3,
                name: 'Test 3',
                age: 1
            }
        ]);
        original.attr([
            {
                id: 1,
                name: 'Test 1',
                age: 120
            },
            {
                id: 2,
                name: 'Test 2',
                age: 180
            },
            {
                id: 3,
                name: 'Test 3',
                age: 101
            }
        ]);
        equal(original.attr('0.id'), 1);
        equal(original.attr('0.age'), 120, 'Test 1\'s age incremented by 100 years');
        equal(original.attr('1.id'), 2);
        equal(original.attr('1.age'), 180, 'Test 2\'s age incremented by 100 years');
        equal(original.attr('2.id'), 3);
        equal(original.attr('2.age'), 101, 'Test 3\'s age incremented by 100 years');
    });
    test('map', function () {
        var original = new can.List([
            {
                name: 'Test 1',
                age: 20
            },
            {
                name: 'Test 2',
                age: 80
            },
            {
                name: 'Test 3',
                age: 1
            }
        ]);
        var mapped = original.map(function (element) {
            return element.attr('name') + ' (' + element.attr('age') + ')';
        });
        equal(mapped.length, 3, 'All items mapped');
        original.attr('0.name', 'Updated test');
        original.attr('0.age', '24');
        equal(mapped[0], 'Updated test (24)', 'Mapping got updated');
        original.push({
            name: 'Push test',
            age: 99
        });
        equal(mapped[mapped.length - 1], 'Push test (' + 99 + ')');
        original.shift();
        equal(mapped.length, 3, 'Item got removed');
    });
});
/*map/define/define_test*/
define('can/map/define/define_test', function (require, exports, module) {
    var can = require('can/util/util');
    require('can/map/define/define');
    require('can/route/route');
    require('steal-qunit');
    QUnit.module('can/map/define');
    test('basics set', function () {
        var Defined = can.Map.extend({
            define: {
                prop: {
                    set: function (newVal) {
                        return 'foo' + newVal;
                    }
                }
            }
        });
        var def = new Defined();
        def.attr('prop', 'bar');
        equal(def.attr('prop'), 'foobar', 'setter works');
        Defined = can.Map.extend({
            define: {
                prop: {
                    set: function (newVal, setter) {
                        setter('foo' + newVal);
                    }
                }
            }
        });
        def = new Defined();
        def.attr('prop', 'bar');
        equal(def.attr('prop'), 'foobar', 'setter callback works');
    });
    test('basics remove', function () {
        var ViewModel = can.Map.extend({
            define: {
                makeId: {
                    remove: function () {
                        this.removeAttr('models');
                    }
                },
                models: {
                    remove: function () {
                        this.removeAttr('modelId');
                    }
                },
                modelId: {
                    remove: function () {
                        this.removeAttr('years');
                    }
                },
                years: {
                    remove: function () {
                        this.removeAttr('year');
                    }
                }
            }
        });
        var mmy = new ViewModel({
            makes: [{ id: 1 }],
            makeId: 1,
            models: [{ id: 2 }],
            modelId: 2,
            years: [2010],
            year: 2010
        });
        var events = [
                'year',
                'years',
                'modelId',
                'models',
                'makeId'
            ], eventCount = 0, batchNum;
        mmy.bind('change', function (ev, attr) {
            if (batchNum === undefined) {
                batchNum = ev.batchNum;
            }
            equal(attr, events[eventCount++], 'got correct attribute');
            ok(ev.batchNum && ev.batchNum === batchNum, 'batched');
        });
        mmy.removeAttr('makeId');
    });
    test('basics get', function () {
        var Person = can.Map.extend({
            define: {
                fullName: {
                    get: function () {
                        return this.attr('first') + ' ' + this.attr('last');
                    }
                }
            }
        });
        var p = new Person({
            first: 'Justin',
            last: 'Meyer'
        });
        equal(p.attr('fullName'), 'Justin Meyer', 'sync getter works');
        var Adder = can.Map.extend({
            define: {
                more: {
                    get: function (curVal, setVal) {
                        var num = this.attr('num');
                        setTimeout(function () {
                            setVal(num + 1);
                        }, 10);
                    }
                }
            }
        });
        var a = new Adder({ num: 1 }), callbackVals = [
                [
                    2,
                    undefined,
                    function () {
                        a.attr('num', 2);
                    }
                ],
                [
                    3,
                    2,
                    function () {
                        start();
                    }
                ]
            ], callbackCount = 0;
        a.bind('more', function (ev, newVal, oldVal) {
            var vals = callbackVals[callbackCount++];
            equal(newVal, vals[0], 'newVal is correct');
            equal(a.attr('more'), vals[0], 'attr value is correct');
            equal(oldVal, vals[1], 'oldVal is correct');
            setTimeout(vals[2], 10);
        });
        stop();
    });
    test('basic type', function () {
        expect(6);
        var Typer = can.Map.extend({
            define: {
                arrayWithAddedItem: {
                    type: function (value) {
                        if (value && value.push) {
                            value.push('item');
                        }
                        return value;
                    }
                },
                listWithAddedItem: {
                    type: function (value) {
                        if (value && value.push) {
                            value.push('item');
                        }
                        return value;
                    },
                    Type: can.List
                }
            }
        });
        var t = new Typer();
        deepEqual(can.Map.keys(t), [], 'no keys');
        var array = [];
        t.attr('arrayWithAddedItem', array);
        deepEqual(array, ['item'], 'updated array');
        equal(t.attr('arrayWithAddedItem'), array, 'leave value as array');
        t.attr('listWithAddedItem', []);
        ok(t.attr('listWithAddedItem') instanceof can.List, 'convert to can.List');
        equal(t.attr('listWithAddedItem').attr(0), 'item', 'has item in it');
        t.bind('change', function (ev, attr) {
            equal(attr, 'listWithAddedItem.1', 'got a bubbling event');
        });
        t.attr('listWithAddedItem').push('another item');
    });
    test('basic Type', function () {
        var Foo = function (name) {
            this.name = name;
        };
        Foo.prototype.getName = function () {
            return this.name;
        };
        var Typer = can.Map.extend({ define: { foo: { Type: Foo } } });
        var t = new Typer({ foo: 'Justin' });
        equal(t.attr('foo').getName(), 'Justin', 'correctly created an instance');
        var brian = new Foo('brian');
        t.attr('foo', brian);
        equal(t.attr('foo'), brian, 'same instances');
    });
    test('type converters', function () {
        var Typer = can.Map.extend({
            define: {
                date: { type: 'date' },
                string: { type: 'string' },
                number: { type: 'number' },
                'boolean': { type: 'boolean' },
                htmlbool: { type: 'htmlbool' },
                leaveAlone: { type: '*' }
            }
        });
        var obj = {};
        var t = new Typer({
            date: 1395896701516,
            string: 5,
            number: '5',
            'boolean': 'false',
            htmlbool: '',
            leaveAlone: obj
        });
        ok(t.attr('date') instanceof Date, 'converted to date');
        equal(t.attr('string'), '5', 'converted to string');
        equal(t.attr('number'), 5, 'converted to number');
        equal(t.attr('boolean'), false, 'converted to boolean');
        equal(t.attr('htmlbool'), true, 'converted to htmlbool');
        equal(t.attr('leaveAlone'), obj, 'left as object');
        t.attr({ 'number': '15' });
        ok(t.attr('number') === 15, 'converted to number');
    });
    test('basics value', function () {
        var Typer = can.Map.extend({ define: { prop: { value: 'foo' } } });
        equal(new Typer().attr('prop'), 'foo', 'value is used as default value');
        var Typer2 = can.Map.extend({
            define: {
                prop: {
                    value: function () {
                        return [];
                    },
                    type: '*'
                }
            }
        });
        var t1 = new Typer2(), t2 = new Typer2();
        ok(t1.attr('prop') !== t2.attr('prop'), 'different array instances');
        ok(can.isArray(t1.attr('prop')), 'its an array');
    });
    test('basics Value', function () {
        var Typer = can.Map.extend({
            define: {
                prop: {
                    Value: Array,
                    type: '*'
                }
            }
        });
        var t1 = new Typer(), t2 = new Typer();
        ok(t1.attr('prop') !== t2.attr('prop'), 'different array instances');
        ok(can.isArray(t1.attr('prop')), 'its an array');
    });
    test('setter with no arguments and returns undefined does the default behavior, the setter is for side effects only', function () {
        var Typer = can.Map.extend({
            define: {
                prop: {
                    set: function () {
                        this.attr('foo', 'bar');
                    }
                }
            }
        });
        var t = new Typer();
        t.attr('prop', false);
        deepEqual(t.attr(), {
            foo: 'bar',
            prop: false
        });
    });
    test('type happens before the set', function () {
        var MyMap = can.Map.extend({
            define: {
                prop: {
                    type: 'number',
                    set: function (newValue) {
                        equal(typeof newValue, 'number', 'got a number');
                        return newValue + 1;
                    }
                }
            }
        });
        var map = new MyMap();
        map.attr('prop', '5');
        equal(map.attr('prop'), 6, 'number');
    });
    test('getter and setter work', function () {
        expect(5);
        var Paginate = can.Map.extend({
            define: {
                page: {
                    set: function (newVal) {
                        this.attr('offset', (parseInt(newVal) - 1) * this.attr('limit'));
                    },
                    get: function () {
                        return Math.floor(this.attr('offset') / this.attr('limit')) + 1;
                    }
                }
            }
        });
        var p = new Paginate({
            limit: 10,
            offset: 20
        });
        equal(p.attr('page'), 3, 'page get right');
        p.bind('page', function (ev, newValue, oldValue) {
            equal(newValue, 2, 'got new value event');
            equal(oldValue, 3, 'got old value event');
        });
        p.attr('page', 2);
        equal(p.attr('page'), 2, 'page set right');
        equal(p.attr('offset'), 10, 'page offset set');
    });
    test('getter with initial value', function () {
        var compute = can.compute(1);
        var Grabber = can.Map.extend({
            define: {
                vals: {
                    type: '*',
                    Value: Array,
                    get: function (current, setVal) {
                        if (setVal) {
                            current.push(compute());
                        }
                        return current;
                    }
                }
            }
        });
        var g = new Grabber();
        equal(g.attr('vals').length, 0, 'zero items in array');
    });
    test('serialize basics', function () {
        var MyMap = can.Map.extend({
            define: {
                name: {
                    serialize: function () {
                        return;
                    }
                },
                locations: { serialize: false },
                locationIds: {
                    get: function () {
                        var ids = [];
                        this.attr('locations').each(function (location) {
                            ids.push(location.id);
                        });
                        return ids;
                    },
                    serialize: function (locationIds) {
                        return locationIds.join(',');
                    }
                },
                bared: {
                    get: function () {
                        return this.attr('name') + '+bar';
                    },
                    serialize: true
                },
                ignored: {
                    get: function () {
                        return this.attr('name') + '+ignored';
                    }
                }
            }
        });
        var map = new MyMap({ name: 'foo' });
        map.attr('locations', [
            {
                id: 1,
                name: 'Chicago'
            },
            {
                id: 2,
                name: 'LA'
            }
        ]);
        equal(map.attr('locationIds').length, 2, 'get locationIds');
        equal(map.attr('locationIds')[0], 1, 'get locationIds index 0');
        equal(map.attr('locations')[0].id, 1, 'get locations index 0');
        var serialized = map.serialize();
        equal(serialized.locations, undefined, 'locations doesn\'t serialize');
        equal(serialized.locationIds, '1,2', 'locationIds serializes');
        equal(serialized.name, undefined, 'name doesn\'t serialize');
        equal(serialized.bared, 'foo+bar', 'true adds computed props');
        equal(serialized.ignored, undefined, 'computed props are not serialized by default');
    });
    test('serialize context', function () {
        var context, serializeContext;
        var MyMap = can.Map.extend({
            define: {
                name: {
                    serialize: function (obj) {
                        context = this;
                        return obj;
                    }
                }
            },
            serialize: function () {
                serializeContext = this;
                can.Map.prototype.serialize.apply(this, arguments);
            }
        });
        var map = new MyMap();
        map.serialize();
        equal(context, map);
        equal(serializeContext, map);
    });
    test('methods contexts', function () {
        var contexts = {};
        var MyMap = can.Map.extend({
            define: {
                name: {
                    value: 'John Galt',
                    get: function (obj) {
                        contexts.get = this;
                        return obj;
                    },
                    remove: function (obj) {
                        contexts.remove = this;
                        return obj;
                    },
                    set: function (obj) {
                        contexts.set = this;
                        return obj;
                    },
                    serialize: function (obj) {
                        contexts.serialize = this;
                        return obj;
                    },
                    type: function (val) {
                        contexts.type = this;
                        return val;
                    }
                }
            }
        });
        var map = new MyMap();
        map.serialize();
        map.removeAttr('name');
        equal(contexts.get, map);
        equal(contexts.remove, map);
        equal(contexts.set, map);
        equal(contexts.serialize, map);
        equal(contexts.type, map);
    });
    test('value generator is not called if default passed', function () {
        var TestMap = can.Map.extend({
            define: {
                foo: {
                    value: function () {
                        throw '"foo"\'s value method should not be called.';
                    }
                }
            }
        });
        var tm = new TestMap({ foo: 'baz' });
        equal(tm.attr('foo'), 'baz');
    });
    test('Value generator can read other properties', function () {
        var Map = can.Map.extend({
            letters: 'ABC',
            numbers: [
                1,
                2,
                3
            ],
            define: {
                definedLetters: { value: 'DEF' },
                definedNumbers: {
                    value: [
                        4,
                        5,
                        6
                    ]
                },
                generatedLetters: {
                    value: function () {
                        return 'GHI';
                    }
                },
                generatedNumbers: {
                    value: function () {
                        return new can.List([
                            7,
                            8,
                            9
                        ]);
                    }
                },
                firstLetter: {
                    value: function () {
                        return this.attr('letters').substr(0, 1);
                    }
                },
                firstNumber: {
                    value: function () {
                        return this.attr('numbers.0');
                    }
                },
                middleLetter: {
                    value: function () {
                        return this.attr('definedLetters').substr(1, 1);
                    }
                },
                middleNumber: {
                    value: function () {
                        return this.attr('definedNumbers.1');
                    }
                },
                lastLetter: {
                    value: function () {
                        return this.attr('generatedLetters').substr(2, 1);
                    }
                },
                lastNumber: {
                    value: function () {
                        return this.attr('generatedNumbers.2');
                    }
                }
            }
        });
        var map = new Map();
        var prefix = 'Was able to read dependent value from ';
        equal(map.attr('firstLetter'), 'A', prefix + 'traditional can.Map style property definition');
        equal(map.attr('firstNumber'), 1, prefix + 'traditional can.Map style property definition');
        equal(map.attr('middleLetter'), 'E', prefix + 'define plugin style default property definition');
        equal(map.attr('middleNumber'), 5, prefix + 'define plugin style default property definition');
        equal(map.attr('lastLetter'), 'I', prefix + 'define plugin style generated default property definition');
        equal(map.attr('lastNumber'), 9, prefix + 'define plugin style generated default property definition');
    });
    test('default behaviors with "*" work for attributes', function () {
        expect(9);
        var DefaultMap = can.Map.extend({
            define: {
                someNumber: { value: '5' },
                '*': {
                    type: 'number',
                    serialize: function (value) {
                        return '' + value;
                    },
                    set: function (newVal) {
                        ok(true, 'set called');
                        return newVal;
                    },
                    remove: function (currentVal) {
                        ok(true, 'remove called');
                        return false;
                    }
                }
            }
        });
        var map = new DefaultMap(), serializedMap;
        equal(map.attr('someNumber'), 5, 'value of someNumber should be converted to a number');
        map.attr('number', '10');
        equal(map.attr('number'), 10, 'value of number should be converted to a number');
        map.removeAttr('number');
        equal(map.attr('number'), 10, 'number should not be removed');
        serializedMap = map.serialize();
        equal(serializedMap.number, '10', 'number serialized as string');
        equal(serializedMap.someNumber, '5', 'someNumber serialized as string');
        equal(serializedMap['*'], undefined, '"*" is not a value in serialized object');
    });
    test('models properly serialize with default behaviors', function () {
        var DefaultMap = can.Map.extend({
            define: {
                name: { value: 'Alex' },
                shirt: {
                    value: 'blue',
                    serialize: true
                },
                '*': { serialize: false }
            }
        });
        var map = new DefaultMap({
                age: 10,
                name: 'John'
            }), serializedMap = map.serialize();
        equal(serializedMap.age, undefined, 'age doesn\'t exist');
        equal(serializedMap.name, undefined, 'name doesn\'t exist');
        equal(serializedMap.shirt, 'blue', 'shirt exists');
    });
    test('nested define', function () {
        var nailedIt = 'Nailed it';
        var Example = can.Map.extend({}, { define: { name: { value: nailedIt } } });
        var NestedMap = can.Map.extend({}, {
            define: {
                isEnabled: { value: true },
                test: { Value: Example },
                examples: {
                    value: {
                        define: {
                            one: { Value: Example },
                            two: { value: { define: { deep: { Value: Example } } } }
                        }
                    }
                }
            }
        });
        var nested = new NestedMap();
        equal(nested.attr('test.name'), nailedIt);
        equal(nested.attr('examples.one.name'), nailedIt);
        equal(nested.attr('examples.two.deep.name'), nailedIt);
        ok(nested.attr('test') instanceof Example);
        ok(nested.attr('examples.one') instanceof Example);
        ok(nested.attr('examples.two.deep') instanceof Example);
    });
    test('Can make an attr alias a compute (#1470)', 9, function () {
        var computeValue = can.compute(1);
        var GetMap = can.Map.extend({
            define: {
                value: {
                    set: function (newValue, setVal, setErr, oldValue) {
                        if (newValue.isComputed) {
                            return newValue;
                        }
                        if (oldValue && oldValue.isComputed) {
                            oldValue(newValue);
                            return oldValue;
                        }
                        return newValue;
                    },
                    get: function (value) {
                        return value && value.isComputed ? value() : value;
                    }
                }
            }
        });
        var getMap = new GetMap();
        getMap.attr('value', computeValue);
        equal(getMap.attr('value'), 1);
        var bindCallbacks = 0;
        getMap.bind('value', function (ev, newVal, oldVal) {
            switch (bindCallbacks) {
            case 0:
                equal(newVal, 2, '0 - bind called with new val');
                equal(oldVal, 1, '0 - bind called with old val');
                break;
            case 1:
                equal(newVal, 3, '1 - bind called with new val');
                equal(oldVal, 2, '1 - bind called with old val');
                break;
            case 2:
                equal(newVal, 4, '2 - bind called with new val');
                equal(oldVal, 3, '2 - bind called with old val');
                break;
            }
            bindCallbacks++;
        });
        computeValue(2);
        getMap.attr('value', 3);
        equal(getMap.attr('value'), 3, 'read value is 3');
        equal(computeValue(), 3, 'the compute value is 3');
        var newComputeValue = can.compute(4);
        getMap.attr('value', newComputeValue);
    });
    test('setting a value of a property with type "compute" triggers change events', function () {
        var handler;
        var message = 'The change event passed the correct {prop} when set with {method}';
        var createChangeHandler = function (expectedOldVal, expectedNewVal, method) {
            return function (ev, newVal, oldVal) {
                var subs = {
                    prop: 'newVal',
                    method: method
                };
                equal(newVal, expectedNewVal, can.sub(message, subs));
                subs.prop = 'oldVal';
                equal(oldVal, expectedOldVal, can.sub(message, subs));
            };
        };
        var ComputableMap = can.Map.extend({ define: { computed: { type: 'compute' } } });
        var computed = can.compute(0);
        var m1 = new ComputableMap({ computed: computed });
        equal(m1.attr('computed'), 0, 'm1 is 1');
        handler = createChangeHandler(0, 1, '.attr(\'computed\', newVal)');
        handler = createChangeHandler(0, 1, '.attr(\'computed\', newVal)');
        m1.bind('computed', handler);
        m1.attr('computed', 1);
        m1.unbind('computed', handler);
        handler = createChangeHandler(1, 2, 'computed()');
        m1.bind('computed', handler);
        computed(2);
        m1.unbind('computed', handler);
    });
    test('replacing the compute on a property with type "compute"', function () {
        var compute1 = can.compute(0);
        var compute2 = can.compute(1);
        var ComputableMap = can.Map.extend({ define: { computable: { type: 'compute' } } });
        var m = new ComputableMap();
        m.attr('computable', compute1);
        equal(m.attr('computable'), 0, 'compute1 readable via .attr()');
        m.attr('computable', compute2);
        equal(m.attr('computable'), 1, 'compute2 readable via .attr()');
    });
    test('value and get (#1521)', function () {
        var MyMap = can.Map.extend({
            define: {
                data: {
                    value: function () {
                        return new can.List(['test']);
                    }
                },
                size: {
                    value: 1,
                    get: function (val) {
                        var list = this.attr('data');
                        var length = list.attr('length');
                        return val + length;
                    }
                }
            }
        });
        var map = new MyMap({});
        equal(map.attr('size'), 2);
    });
    test('One event on getters (#1585)', function () {
        var AppState = can.Map.extend({
            define: {
                person: {
                    get: function (lastSetValue, setAttrValue) {
                        if (lastSetValue) {
                            return lastSetValue;
                        } else if (this.attr('personId')) {
                            setAttrValue(new can.Map({
                                name: 'Jose',
                                id: 5
                            }));
                        } else {
                            return null;
                        }
                    }
                }
            }
        });
        var appState = new AppState();
        var personEvents = 0;
        appState.bind('person', function (ev, person) {
            personEvents++;
        });
        appState.attr('personId', 5);
        appState.attr('person', new can.Map({ name: 'Julia' }));
        equal(personEvents, 2);
    });
    test('Can read a defined property with a set/get method (#1648)', function () {
        var Map = can.Map.extend({
            define: {
                foo: {
                    value: '',
                    set: function (setVal) {
                        return setVal;
                    },
                    get: function (lastSetVal) {
                        return lastSetVal;
                    }
                }
            }
        });
        var map = new Map();
        equal(map.attr('foo'), '', 'Calling .attr(\'foo\') returned the correct value');
        map.attr('foo', 'baz');
        equal(map.attr('foo'), 'baz', 'Calling .attr(\'foo\') returned the correct value');
    });
    test('Can bind to a defined property with a set/get method (#1648)', 3, function () {
        var Map = can.Map.extend({
            define: {
                foo: {
                    value: '',
                    set: function (setVal) {
                        return setVal;
                    },
                    get: function (lastSetVal) {
                        return lastSetVal;
                    }
                }
            }
        });
        var map = new Map();
        map.bind('foo', function () {
            ok(true, 'Bound function is called');
        });
        equal(map.attr('foo'), '', 'Calling .attr(\'foo\') returned the correct value');
        map.attr('foo', 'baz');
        equal(map.attr('foo'), 'baz', 'Calling .attr(\'foo\') returned the correct value');
    });
    test('type converters handle null and undefined in expected ways (1693)', function () {
        var Typer = can.Map.extend({
            define: {
                date: { type: 'date' },
                string: { type: 'string' },
                number: { type: 'number' },
                'boolean': { type: 'boolean' },
                htmlbool: { type: 'htmlbool' },
                leaveAlone: { type: '*' }
            }
        });
        var t = new Typer().attr({
            date: undefined,
            string: undefined,
            number: undefined,
            'boolean': undefined,
            htmlbool: undefined,
            leaveAlone: undefined
        });
        equal(t.attr('date'), undefined, 'converted to date');
        equal(t.attr('string'), undefined, 'converted to string');
        equal(t.attr('number'), undefined, 'converted to number');
        equal(t.attr('boolean'), false, 'converted to boolean');
        equal(t.attr('htmlbool'), false, 'converted to htmlbool');
        equal(t.attr('leaveAlone'), undefined, 'left as object');
        t = new Typer().attr({
            date: null,
            string: null,
            number: null,
            'boolean': null,
            htmlbool: null,
            leaveAlone: null
        });
        equal(t.attr('date'), null, 'converted to date');
        equal(t.attr('string'), null, 'converted to string');
        equal(t.attr('number'), null, 'converted to number');
        equal(t.attr('boolean'), false, 'converted to boolean');
        equal(t.attr('htmlbool'), false, 'converted to htmlbool');
        equal(t.attr('leaveAlone'), null, 'left as object');
    });
    test('Initial value does not call getter', function () {
        expect(0);
        var Map = can.Map.extend({
            define: {
                count: {
                    get: function (lastVal) {
                        ok(false, 'Should not be called');
                        return lastVal;
                    }
                }
            }
        });
        new Map({ count: 100 });
    });
    test('getters produce change events', function () {
        var Map = can.Map.extend({
            define: {
                count: {
                    get: function (lastVal) {
                        return lastVal;
                    }
                }
            }
        });
        var map = new Map();
        map.bind('change', function () {
            ok(true, 'change called');
        });
        map.attr('count', 22);
    });
    test('Asynchronous virtual properties cause extra recomputes (#1915)', function () {
        stop();
        var ran = false;
        var VM = can.Map.extend({
            define: {
                foo: {
                    get: function (lastVal, setVal) {
                        setTimeout(function () {
                            if (setVal) {
                                setVal(5);
                            }
                        }, 10);
                    }
                },
                bar: {
                    get: function () {
                        var foo = this.attr('foo');
                        if (foo) {
                            if (ran) {
                                ok(false, 'Getter ran twice');
                            }
                            ran = true;
                            return foo * 2;
                        }
                    }
                }
            }
        });
        var vm = new VM();
        vm.bind('bar', function () {
        });
        setTimeout(function () {
            equal(vm.attr('bar'), 10);
            start();
        }, 200);
    });
    test('double get in a compute (#2230)', function () {
        var VM = can.Map.extend({
            define: {
                names: {
                    get: function (val, setVal) {
                        ok(setVal, 'setVal passed');
                        return 'Hi!';
                    }
                }
            }
        });
        var vm = new VM();
        var c = can.compute(function () {
            return vm.attr('names');
        });
        c.bind('change', function () {
        });
    });
});
/*list/sort/sort_test*/
define('can/list/sort/sort_test', function (require, exports, module) {
    var can = require('can/can');
    require('can/list/sort/sort');
    require('can/view/stache/stache');
    require('can/model/model');
    require('steal-qunit');
    QUnit.module('can/list/sort');
    test('List events', 4 * 3, function () {
        var list = new can.List([
            { name: 'Justin' },
            { name: 'Brian' },
            { name: 'Austin' },
            { name: 'Mihael' }
        ]);
        list.attr('comparator', 'name');
        list.bind('move', function (ev, item, newPos, oldPos) {
            ok(ev, '"move" event passed `ev`');
            equal(item.name, 'Zed', '"move" event passed correct `item`');
            equal(newPos, 3, '"move" event passed correct `newPos`');
            equal(oldPos, 0, '"move" event passed correct `oldPos`');
        });
        list.bind('remove', function (ev, items, oldPos) {
            ok(ev, '"remove" event passed ev');
            equal(items.length, 1, '"remove" event passed correct # of `item`\'s');
            equal(items[0].name, 'Alexis', '"remove" event passed correct `item`');
            equal(oldPos, 0, '"remove" event passed correct `oldPos`');
        });
        list.bind('add', function (ev, items, index) {
            ok(ev, '"add" event passed ev');
            equal(items.length, 1, '"add" event passed correct # of items');
            equal(items[0].name, 'Alexis', '"add" event passed correct `item`');
            equal(index, 0, '"add" event passed correct `index`');
        });
        list.push({ name: 'Alexis' });
        list.splice(0, 1);
        list[0].attr('name', 'Zed');
    });
    test('Passing a comparator function to sort()', 1, function () {
        var list = new can.List([
            {
                priority: 4,
                name: 'low'
            },
            {
                priority: 1,
                name: 'high'
            },
            {
                priority: 2,
                name: 'middle'
            },
            {
                priority: 3,
                name: 'mid'
            }
        ]);
        list.sort(function (a, b) {
            if (a.priority < b.priority) {
                return -1;
            }
            return a.priority > b.priority ? 1 : 0;
        });
        equal(list[0].name, 'high');
    });
    test('Passing a comparator string to sort()', 1, function () {
        var list = new can.List([
            {
                priority: 4,
                name: 'low'
            },
            {
                priority: 1,
                name: 'high'
            },
            {
                priority: 2,
                name: 'middle'
            },
            {
                priority: 3,
                name: 'mid'
            }
        ]);
        list.sort('priority');
        equal(list[0].name, 'high');
    });
    test('Defining a comparator property', 1, function () {
        var list = new can.List([
            {
                priority: 4,
                name: 'low'
            },
            {
                priority: 1,
                name: 'high'
            },
            {
                priority: 2,
                name: 'middle'
            },
            {
                priority: 3,
                name: 'mid'
            }
        ]);
        list.attr('comparator', 'priority');
        equal(list[0].name, 'high');
    });
    test('Defining a comparator property that is a function of a can.Map', 4, function () {
        var list = new can.Map.List([
            new can.Map({
                text: 'Bbb',
                func: can.compute(function () {
                    return 'bbb';
                })
            }),
            new can.Map({
                text: 'abb',
                func: can.compute(function () {
                    return 'abb';
                })
            }),
            new can.Map({
                text: 'Aaa',
                func: can.compute(function () {
                    return 'aaa';
                })
            }),
            new can.Map({
                text: 'baa',
                func: can.compute(function () {
                    return 'baa';
                })
            })
        ]);
        list.attr('comparator', 'func');
        equal(list.attr()[0].text, 'Aaa');
        equal(list.attr()[1].text, 'abb');
        equal(list.attr()[2].text, 'baa');
        equal(list.attr()[3].text, 'Bbb');
    });
    test('Sorts primitive items', function () {
        var list = new can.List([
            'z',
            'y',
            'x'
        ]);
        list.sort();
        equal(list[0], 'x', 'Moved string to correct index');
    });
    function renderedTests(templateEngine, helperType, renderer) {
        test('Insert pushed item at correct index with ' + templateEngine + ' using ' + helperType + ' helper', function () {
            var el = document.createElement('div');
            var items = new can.List([{ id: 'b' }]);
            items.attr('comparator', 'id');
            el.appendChild(renderer({ items: items }));
            var firstElText = el.querySelector('li').firstChild.data;
            equal(firstElText, 'b', 'First LI is a "b"');
            items.push({ id: 'a' });
            firstElText = el.querySelector('li').firstChild.data;
            equal(firstElText, 'a', 'An item pushed into the list is rendered at the correct position');
        });
        test('Insert unshifted item at correct index with ' + templateEngine + ' using ' + helperType + ' helper', function () {
            var el = document.createElement('div');
            var items = new can.List([
                { id: 'a' },
                { id: 'c' }
            ]);
            items.attr('comparator', 'id');
            el.appendChild(renderer({ items: items }));
            var firstElText = el.querySelector('li').firstChild.data;
            equal(firstElText, 'a', 'First LI is a "a"');
            items.unshift({ id: 'b' });
            firstElText = el.querySelectorAll('li')[1].firstChild.data;
            equal(firstElText, 'b', 'An item unshifted into the list is rendered at the correct position');
        });
        test('Insert spliced item at correct index with ' + templateEngine + ' using ' + helperType + ' helper', function () {
            var el = document.createElement('div');
            var items = new can.List([
                { id: 'b' },
                { id: 'c' }
            ]);
            items.attr('comparator', 'id');
            el.appendChild(renderer({ items: items }));
            var firstElText = el.querySelector('li').firstChild.data;
            equal(firstElText, 'b', 'First LI is a b');
            items.splice(1, 0, { id: 'a' });
            firstElText = el.querySelector('li').firstChild.data;
            equal(firstElText, 'a', 'An item spliced into the list at the wrong position is rendered ' + 'at the correct position');
        });
        test('Moves rendered item to correct index after "set" using ' + helperType + ' helper', function () {
            var el = document.createElement('div');
            var items = new can.List([
                { id: 'x' },
                { id: 'y' },
                { id: 'z' }
            ]);
            items.attr('comparator', 'id');
            el.appendChild(renderer({ items: items }));
            var firstElText = el.querySelector('li').firstChild.data;
            equal(firstElText, 'x', 'First LI is a "x"');
            items.attr('2').attr('id', 'a');
            firstElText = el.querySelector('li').firstChild.data;
            equal(firstElText, 'a', 'The last item was moved to the first position ' + 'after it\'s value was changed');
        });
        test('Move DOM items when list is sorted with  ' + templateEngine + ' using the ' + helperType + ' helper', function () {
            var el = document.createElement('div');
            var items = new can.List([
                { id: 4 },
                { id: 1 },
                { id: 6 },
                { id: 3 },
                { id: 2 },
                { id: 8 },
                { id: 0 },
                { id: 5 },
                { id: 6 },
                { id: 9 }
            ]);
            el.appendChild(renderer({ items: items }));
            var firstElText = el.querySelector('li').firstChild.data;
            equal(firstElText, 4, 'First LI is a "4"');
            items.attr('comparator', 'id');
            firstElText = el.querySelector('li').firstChild.data;
            equal(firstElText, 0, 'The `0` was moved to beginning of the list' + 'once sorted.');
        });
        test('Push multiple items with ' + templateEngine + ' using the ' + helperType + ' helper (#1509)', function () {
            var el = document.createElement('div');
            var items = new can.List();
            items.attr('comparator', 'id');
            el.appendChild(renderer({ items: items }));
            items.bind('add', function (ev, items) {
                equal(items.length, 1, 'One single item was added');
            });
            items.push.apply(items, [
                { id: 4 },
                { id: 1 },
                { id: 6 }
            ]);
            var liLength = el.getElementsByTagName('li').length;
            equal(liLength, 3, 'The correct number of items have been rendered');
        });
    }
    var blockHelperTemplate = '<ul>{{#items}}<li>{{id}}</li>{{/items}}';
    var eachHelperTemplate = '<ul>{{#each items}}<li>{{id}}</li>{{/each}}';
    renderedTests('Stache', '{{#block}}', can.stache(blockHelperTemplate));
    renderedTests('Stache', '{{#each}}', can.stache(eachHelperTemplate));
    test('Sort primitive values without a comparator defined', function () {
        var list = new can.List([
            8,
            5,
            2,
            1,
            5,
            9,
            3,
            5
        ]);
        list.sort();
        equal(list[0], 1, 'Sorted the list in ascending order');
    });
    test('Sort primitive values with a comparator function defined', function () {
        var list = new can.List([
            8,
            5,
            2,
            1,
            5,
            9,
            3,
            5
        ]);
        list.attr('comparator', function (a, b) {
            return a === b ? 0 : a < b ? 1 : -1;
        });
        equal(list[0], 9, 'Sorted the list in descending order');
    });
    test('The "destroyed" event bubbles on a sorted list', 2, function () {
        var list = new can.Model.List([
            new can.Model({ name: 'Joe' }),
            new can.Model({ name: 'Max' }),
            new can.Model({ name: 'Pim' })
        ]);
        list.attr('comparator', 'name');
        list.bind('destroyed', function (ev) {
            ok(true, '"destroyed" event triggered');
        });
        list.attr(0).destroy();
        equal(list.attr('length'), 2, 'item removed');
    });
    test('sorting works with #each (#1566)', function () {
        var heroes = new can.List([
            {
                id: 1,
                name: 'Superman'
            },
            {
                id: 2,
                name: 'Batman'
            }
        ]);
        heroes.attr('comparator', 'name');
        var template = can.stache('<ul>\n{{#each heroes}}\n<li>{{id}}-{{name}}</li>\n{{/each}}</ul>');
        var frag = template({ heroes: heroes });
        var lis = frag.childNodes[0].getElementsByTagName('li');
        equal(lis[0].innerHTML, '2-Batman');
        equal(lis[1].innerHTML, '1-Superman');
        heroes.attr('comparator', 'id');
        equal(lis[0].innerHTML, '1-Superman');
        equal(lis[1].innerHTML, '2-Batman');
    });
    test('sorting works with comparator added after a binding', function () {
        var heroes = new can.List([
            {
                id: 1,
                name: 'Superman'
            },
            {
                id: 2,
                name: 'Batman'
            }
        ]);
        var template = can.stache('<ul>\n{{#each heroes}}\n<li>{{id}}-{{name}}</li>\n{{/each}}</ul>');
        var frag = template({ heroes: heroes });
        heroes.attr('comparator', 'id');
        heroes.attr('0.id', 3);
        var lis = frag.childNodes[0].getElementsByTagName('li');
        equal(lis[0].innerHTML, '2-Batman');
        equal(lis[1].innerHTML, '3-Superman');
    });
    test('removing comparator tears down bubbling', function () {
        var heroes = new can.List([
            {
                id: 1,
                name: 'Superman'
            },
            {
                id: 2,
                name: 'Batman'
            }
        ]);
        var lengthHandler = function () {
        };
        heroes.bind('length', lengthHandler);
        ok(!heroes[0]._bindings, 'item has no bindings');
        heroes.attr('comparator', 'id');
        heroes.attr('0.id', 3);
        ok(heroes._bindings, 'list has bindings');
        ok(heroes[0]._bindings, 'item has bindings');
        heroes.removeAttr('comparator');
        ok(!heroes[0]._bindings, 'has bindings');
        ok(heroes._bindings, 'list has bindings');
        heroes.unbind('length', lengthHandler);
        ok(!heroes._bindings, 'list has no bindings');
    });
    test('sorting works when returning any negative value (#1601)', function () {
        var list = new can.List([
            1,
            4,
            2
        ]);
        list.attr('comparator', function (a, b) {
            return a - b;
        });
        list.sort();
        deepEqual(list.attr(), [
            1,
            2,
            4
        ]);
    });
    test('Batched events originating from sort plugin lack batchNum (#1707)', function () {
        var list = new can.List();
        list.attr('comparator', 'id');
        list.bind('length', function (ev) {
            ok(ev.batchNum, 'Has batchNum');
        });
        can.batch.start();
        list.push({ id: 'a' });
        list.push({ id: 'a' });
        list.push({ id: 'a' });
        can.batch.stop();
    });
    test('The sort plugin\'s _change handler ignores batched _changes (#1706)', function () {
        var list = new can.List();
        var _getRelativeInsertIndex = list._getRelativeInsertIndex;
        var sort = list.sort;
        list.attr('comparator', 'id');
        list.bind('move', function (ev) {
            ok(false, 'No "move" events should be fired');
        });
        list._getRelativeInsertIndex = function () {
            ok(false, 'No items should be evaluated independently');
            return _getRelativeInsertIndex.apply(this, arguments);
        };
        list.sort = function () {
            ok(true, 'Batching caused sort() to be called');
            return sort.apply(this, arguments);
        };
        can.batch.start();
        list.push({
            id: 'c',
            index: 1
        });
        list.push({
            id: 'a',
            index: 2
        });
        list.push({
            id: 'a',
            index: 3
        });
        can.batch.stop();
        equal(list.attr('2.id'), 'c', 'List was sorted');
    });
    test('Items aren\'t unecessarily swapped to the end of a list of equal items (#1705)', function () {
        var list = new can.List([
            {
                id: 'a',
                index: 1
            },
            {
                id: 'b',
                index: 2
            },
            {
                id: 'c',
                index: 3
            }
        ]);
        list.attr('comparator', 'id');
        list.bind('move', function () {
            ok(false, 'No "move" events should be fired');
        });
        list.attr('0.id', 'b');
        equal(list.attr('0.index'), 1, 'Item hasn\'t moved');
        ok(true, '_getRelativeInsertIndex prevented an unecessary \'move\' event');
    });
    test('Items aren\'t unecessarily swapped to the beginning of a list of equal items (#1705)', function () {
        var list = new can.List([
            {
                id: 'a',
                index: 1
            },
            {
                id: 'b',
                index: 2
            },
            {
                id: 'c',
                index: 3
            }
        ]);
        list.attr('comparator', 'id');
        list.bind('move', function () {
            ok(false, 'No "move" events should be fired');
        });
        list.attr('2.id', 'b');
        equal(list.attr('2.index'), 3, 'Item hasn\'t moved');
        ok(true, '_getRelativeInsertIndex prevented an unecessary \'move\' event');
    });
    test('Insert index is not evaluted for irrelevant changes', function () {
        var list = new can.List([
            {
                id: 'a',
                index: 1
            },
            {
                id: 'b',
                index: 2,
                child: {
                    grandchild: {
                        id: 'c',
                        index: 3
                    }
                }
            }
        ]);
        var _getRelativeInsertIndex = list._getRelativeInsertIndex;
        list.bind('move', function (ev) {
            ok(false, 'A "move" events should be fired');
        });
        list._getRelativeInsertIndex = function () {
            ok(false, 'This item should not be evaluated independently');
            return _getRelativeInsertIndex.apply(this, arguments);
        };
        list.attr('comparator', 'id');
        list.attr('0.index', 4);
        list.attr('comparator', 'child.grandchild.id');
        list.attr('1.child.grandchild.index', 4);
        list._getRelativeInsertIndex = function () {
            ok(true, 'This item should be evaluated independently');
            return _getRelativeInsertIndex.apply(this, arguments);
        };
        list.attr('1.child', {
            grandchild: {
                id: 'c',
                index: 4
            }
        });
        equal(list.attr('0.id'), 'a', 'Item not moved');
    });
    test('_getInsertIndex positions items correctly', function () {
        var letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        var alphabet = letters.split('');
        var expected = alphabet.slice(0);
        var sorted = new can.List(alphabet);
        sorted.attr('comparator', can.List.prototype._comparator);
        var samples = [
            '0A',
            'ZZ',
            '**',
            'LM',
            'LL',
            'Josh',
            'James',
            'Juan',
            'Julia',
            '!!HOORAY!!'
        ];
        can.each(samples, function (value) {
            expected.push(value);
            expected.sort(can.List.prototype._comparator);
            sorted.push(value);
            can.each(expected, function (value, index) {
                equal(value, sorted.attr(index), 'Sort plugin output matches native output');
            });
        });
    });
    test('set comparator on init', function () {
        var Item = can.Map.extend();
        Item.List = Item.List.extend({
            init: function () {
                this.attr('comparator', 'isPrimary');
            }
        });
        var items = [
            { isPrimary: false },
            { isPrimary: true },
            { isPrimary: false }
        ];
        deepEqual(new Item.List(items).serialize(), [
            { isPrimary: false },
            { isPrimary: false },
            { isPrimary: true }
        ]);
    });
    test('{{%index}} is updated for "move" events (#1962)', function () {
        var list = new can.List([
            100,
            200,
            300
        ]);
        list.attr('comparator', function (a, b) {
            return a < b ? -1 : 1;
        });
        var template = can.stache('<ul>{{#each list}}<li>' + '<span class="index">{{%index}}</span> - ' + '<span class="value">{{.}}</span>' + '</li>{{/each}}</ul>');
        var frag = template({ list: list });
        var expected;
        var evaluate = function () {
            var liEls = frag.querySelectorAll('li');
            for (var i = 0; i < expected.length; i++) {
                var li = liEls[i];
                var index = li.querySelectorAll('.index')[0].innerHTML;
                var value = li.querySelectorAll('.value')[0].innerHTML;
                equal(index, '' + i, '{{%index}} rendered correct value');
                equal(value, '' + expected[i], '{{.}} rendered correct value');
            }
        };
        expected = [
            100,
            200,
            300
        ];
        evaluate();
        list.attr('comparator', function (a, b) {
            return a < b ? 1 : -1;
        });
        expected = [
            300,
            200,
            100
        ];
        evaluate();
    });
    test('Setting comparator with .sort() (#2159)', function () {
        var list = new can.List([
            {
                letter: 'x',
                number: 3
            },
            {
                letter: 'y',
                number: 2
            },
            {
                letter: 'z',
                number: 1
            }
        ]);
        list.attr('comparator', 'number');
        equal(list.attr('0.number'), 1, 'First value is correct');
        equal(list.attr('1.number'), 2, 'Second value is correct');
        equal(list.attr('2.number'), 3, 'Third value is correct');
        list.sort('letter');
        equal(list.attr('0.letter'), 'x', 'First value is correct after comparator set');
        equal(list.attr('1.letter'), 'y', 'Second value is correct after comparator set');
        equal(list.attr('2.letter'), 'z', 'Third value is correct after comparator set');
        list.push({
            letter: 'w',
            number: 4
        });
        equal(list.attr('0.letter'), 'w', 'First value is correct after insert');
        equal(list.attr('0.number'), 4, 'First value is correct after insert');
    });
});
/*control/plugin/plugin_test*/
define('can/control/plugin/plugin_test', function (require, exports, module) {
    var can = require('can/util/util');
    var $ = require('dist/jquery');
    require('can/control/plugin/plugin');
    require('steal-qunit');
    QUnit.module('can/control/plugin');
    test('pluginName', function () {
        expect(8);
        can.Control('My.TestPlugin', { pluginName: 'my_plugin' }, {
            init: function (el, ops) {
                ok(true, 'Init called');
                equal(ops.testop, 'testing', 'Test argument set');
            },
            method: function (arg) {
                ok(true, 'Method called');
                equal(arg, 'testarg', 'Test argument passed');
            },
            update: function (options) {
                ok(true, 'Update called');
            }
        });
        var ta = can.$('<div/>').addClass('existing_class').appendTo($('#qunit-fixture'));
        ta.my_plugin({ testop: 'testing' });
        ok(ta.hasClass('my_plugin'), 'Should have class my_plugin');
        ta.my_plugin();
        ta.my_plugin('method', 'testarg');
        ta.control().destroy();
        ok(!ta.hasClass('my_plugin'), 'Shouldn\'t have class my_plugin after being destroyed');
        ok(ta.hasClass('existing_class'), 'Existing class should still be there');
    });
    test('.control(), .controls() and _fullname', function () {
        expect(3);
        can.Control('My.TestPlugin', {});
        var ta = can.$('<div/>').appendTo($('#qunit-fixture'));
        ok(ta.my_test_plugin, 'Converting Control name to plugin name worked');
        ta.my_test_plugin();
        equal(ta.controls().length, 1, '.controls() returns one instance');
        ok(ta.control() instanceof My.TestPlugin, 'Control is instance of test plugin');
    });
    test('update', function () {
        can.Control({ pluginName: 'updateTest' }, {});
        var ta = can.$('<div/>').addClass('existing_class').appendTo($('#qunit-fixture'));
        ta.updateTest();
        ta.updateTest({ testop: 'testing' });
        equal(ta.control().options.testop, 'testing', 'Test option has been extended properly');
    });
    test('calling methods', function () {
        can.Control({ pluginName: 'callTest' }, {
            returnTest: function () {
                return 'Hi ' + this.name;
            },
            setName: function (name) {
                this.name = name;
            }
        });
        var ta = can.$('<div/>').appendTo($('#qunit-fixture'));
        ta.callTest();
        ok(ta.callTest('setName', 'Tester') instanceof $, 'Got jQuery element as return value');
        equal(ta.callTest('returnTest'), 'Hi Tester', 'Got correct return value');
    });
    test('always use pluginName first in .control(name) (#448)', 4, function () {
        can.Control('SomeName', { pluginName: 'someTest' }, {});
        can.Control({ pluginName: 'otherTest' }, {});
        var ta = can.$('<div/>').appendTo($('#qunit-fixture'));
        ta.someTest();
        ta.otherTest();
        var control = ta.control('someTest');
        ok(control, 'Got a control from pluginName');
        equal(control.constructor.pluginName, 'someTest', 'Got correct control');
        control = ta.control('otherTest');
        ok(control, 'Got a control from pluginName');
        equal(control.constructor.pluginName, 'otherTest', 'Got correct control');
    });
});
/*view/modifiers/modifiers_test*/
define('can/view/modifiers/modifiers_test', function (require, exports, module) {
    var can = require('can/util/util');
    require('can/map/map');
    require('can/view/stache/stache');
    require('can/view/modifiers/modifiers');
    require('can/test/test');
    require('steal-qunit');
    QUnit.module('can/view/modifiers');
    test('modifier with a deferred', function () {
        $('#qunit-fixture').html('');
        stop();
        var foo = can.Deferred();
        $('#qunit-fixture').html(can.test.path('view/test/deferred.stache'), foo);
        var templateLoaded = new can.Deferred(), id = can.view.toId(can.test.path('view/test/deferred.stache'));
        setTimeout(function () {
            foo.resolve({ foo: 'FOO' });
        }, 1);
        var check = function () {
            if (can.view.cached[id]) {
                templateLoaded.resolve();
            } else {
                setTimeout(check, 10);
            }
        };
        setTimeout(check, 10);
        can.when(foo, templateLoaded).then(function (foo) {
            setTimeout(function () {
                equal($('#qunit-fixture').html(), 'FOO', 'worked!');
                start();
            }, 10);
        });
    });
    test('html takes promise', function () {
        var d = new can.Deferred();
        can.$('#qunit-fixture').html(d);
        stop();
        d.done(function () {
            equal(can.$('#qunit-fixture').html(), 'Hello World', 'deferred is working');
            start();
        });
        setTimeout(function () {
            d.resolve('Hello World');
        }, 10);
    });
    test('hookups don\'t break script execution (issue #130)', function () {
        can.view.hook(function () {
        });
        can.$('#qunit-fixture').html('<script>can.$(\'#qunit-fixture\').html(\'OK\')</script>');
        equal(can.$('#qunit-fixture').html(), 'OK');
        can.$('#qunit-fixture').html('');
        can.view.hookups = {};
    });
});
/*util/fixture/fixture_test*/
define('can/util/fixture/fixture_test', function (require, exports, module) {
    var can = require('can/util/can');
    require('can/util/fixture/fixture');
    require('can/model/model');
    require('can/test/test');
    require('steal-qunit');
    QUnit.module('can/util/fixture');
    test('static fixtures', function () {
        stop();
        can.fixture('GET something', can.test.path('util/fixture/fixtures/test.json'));
        can.fixture('POST something', can.test.path('util/fixture/fixtures/test.json'));
        can.ajax({
            url: 'something',
            dataType: 'json'
        }).done(function (data) {
            equal(data.sweet, 'ness', 'can.get works');
            can.ajax({
                url: 'something',
                method: 'POST',
                dataType: 'json'
            }).done(function (data) {
                equal(data.sweet, 'ness', 'can.post works');
                start();
            });
        });
    });
    test('templated static fixtures', function () {
        stop();
        can.fixture('GET some/{id}', can.test.path('util/fixture/fixtures/stuff.{id}.json'));
        can.ajax({
            url: 'some/3',
            dataType: 'json'
        }).done(function (data) {
            equal(data.id, 3, 'Got data with proper id');
            start();
        });
    });
    test('dynamic fixtures', function () {
        stop();
        can.fixture.delay = 10;
        can.fixture('something', function () {
            return [{ sweet: 'ness' }];
        });
        can.ajax({
            url: 'something',
            dataType: 'json'
        }).done(function (data) {
            equal(data.sweet, 'ness', 'can.get works');
            start();
        });
    });
    test('fixture function', 3, function () {
        stop();
        var url = can.test.path('util/fixture/fixtures/foo.json');
        can.fixture(url, can.test.path('util/fixture/fixtures/foobar.json'));
        can.ajax({
            url: url,
            dataType: 'json'
        }).done(function (data) {
            equal(data.sweet, 'ner', 'url passed works');
            can.fixture(url, can.test.path('util/fixture/fixtures/test.json'));
            can.ajax({
                url: url,
                dataType: 'json'
            }).done(function (data) {
                equal(data.sweet, 'ness', 'replaced');
                can.fixture(url, null);
                can.ajax({
                    url: url,
                    dataType: 'json'
                }).done(function (data) {
                    equal(data.a, 'b', 'removed');
                    start();
                });
            });
        });
    });
    if (typeof jQuery !== 'undefined') {
        test('fixtures with converters', function () {
            stop();
            can.ajax({
                url: can.test.path('util/fixture/fixtures/foobar.json'),
                dataType: 'json fooBar',
                converters: {
                    'json fooBar': function (data) {
                        return 'Mr. ' + data.name;
                    }
                },
                fixture: function () {
                    return { name: 'Justin' };
                },
                success: function (prettyName) {
                    start();
                    equal(prettyName, 'Mr. Justin');
                }
            });
        });
    }
    test('can.fixture.store fixtures', function () {
        stop();
        can.fixture.store('thing', 1000, function (i) {
            return {
                id: i,
                name: 'thing ' + i
            };
        }, function (item, settings) {
            if (settings.data.searchText) {
                var regex = new RegExp('^' + settings.data.searchText);
                return regex.test(item.name);
            }
        });
        can.ajax({
            url: 'things',
            dataType: 'json',
            data: {
                offset: 100,
                limit: 200,
                order: ['name ASC'],
                searchText: 'thing 2'
            },
            fixture: '-things',
            success: function (things) {
                equal(things.data[0].name, 'thing 29', 'first item is correct');
                equal(things.data.length, 11, 'there are 11 items');
                start();
            }
        });
    });
    test('simulating an error', function () {
        var st = '{type: "unauthorized"}';
        can.fixture('/foo', function (request, response) {
            return response(401, st);
        });
        stop();
        can.ajax({
            url: '/foo',
            dataType: 'json'
        }).done(function () {
            ok(false, 'success called');
            start();
        }).fail(function (original, type, text) {
            ok(true, 'error called');
            equal(text, st, 'Original text passed');
            start();
        });
    });
    test('rand', function () {
        var rand = can.fixture.rand;
        var num = rand(5);
        equal(typeof num, 'number');
        ok(num >= 0 && num < 5, 'gets a number');
        stop();
        var zero, three, between, next = function () {
                start();
            };
        setTimeout(function timer() {
            var res = rand([
                1,
                2,
                3
            ]);
            if (res.length === 0) {
                zero = true;
            } else if (res.length === 3) {
                three = true;
            } else {
                between = true;
            }
            if (zero && three && between) {
                ok(true, 'got zero, three, between');
                next();
            } else {
                setTimeout(timer, 10);
            }
        }, 10);
    });
    test('_getData', function () {
        var data = can.fixture._getData('/thingers/{id}', '/thingers/5');
        equal(data.id, 5, 'gets data');
        data = can.fixture._getData('/thingers/5?hi.there', '/thingers/5?hi.there');
        deepEqual(data, {}, 'gets data');
    });
    test('_getData with double character value', function () {
        var data = can.fixture._getData('/days/{id}/time_slots.json', '/days/17/time_slots.json');
        equal(data.id, 17, 'gets data');
    });
    test('_compare', function () {
        var same = can.Object.same({ url: '/thingers/5' }, { url: '/thingers/{id}' }, can.fixture._compare);
        ok(same, 'they are similar');
        same = can.Object.same({ url: '/thingers/5' }, { url: '/thingers' }, can.fixture._compare);
        ok(!same, 'they are not the same');
    });
    test('_similar', function () {
        var same = can.fixture._similar({ url: '/thingers/5' }, { url: '/thingers/{id}' });
        ok(same, 'similar');
        same = can.fixture._similar({
            url: '/thingers/5',
            type: 'get'
        }, { url: '/thingers/{id}' });
        ok(same, 'similar with extra pops on settings');
        var exact = can.fixture._similar({
            url: '/thingers/5',
            type: 'get'
        }, { url: '/thingers/{id}' }, true);
        ok(!exact, 'not exact');
        exact = can.fixture._similar({ url: '/thingers/5' }, { url: '/thingers/5' }, true);
        ok(exact, 'exact');
    });
    test('fixture function gets id', function () {
        can.fixture('/thingers/{id}', function (settings) {
            return {
                id: settings.data.id,
                name: 'justin'
            };
        });
        stop();
        can.ajax({
            url: '/thingers/5',
            dataType: 'json',
            data: { id: 5 }
        }).done(function (data) {
            ok(data.id);
            start();
        });
    });
    test('replacing and removing a fixture', function () {
        var url = can.test.path('util/fixture/fixtures/remove.json');
        can.fixture('GET ' + url, function () {
            return { weird: 'ness!' };
        });
        stop();
        can.ajax({
            url: url,
            dataType: 'json'
        }).done(function (json) {
            equal(json.weird, 'ness!', 'fixture set right');
            can.fixture('GET ' + url, function () {
                return { weird: 'ness?' };
            });
            can.ajax({
                url: url,
                dataType: 'json'
            }).done(function (json) {
                equal(json.weird, 'ness?', 'fixture set right');
                can.fixture('GET ' + url, null);
                can.ajax({
                    url: url,
                    dataType: 'json'
                }).done(function (json) {
                    equal(json.weird, 'ness', 'fixture set right');
                    start();
                });
            });
        });
    });
    test('can.fixture.store with can.Model', function () {
        var store = can.fixture.store(100, function (i) {
                return {
                    id: i,
                    name: 'Object ' + i
                };
            }), Model = can.Model({
                findAll: 'GET /models',
                findOne: 'GET /models/{id}',
                create: 'POST /models',
                update: 'PUT /models/{id}',
                destroy: 'DELETE /models/{id}'
            }, {});
        can.fixture('GET /models', store.findAll);
        can.fixture('GET /models/{id}', store.findOne);
        can.fixture('POST /models', store.create);
        can.fixture('PUT /models/{id}', store.update);
        can.fixture('DELETE /models/{id}', store.destroy);
        stop();
        Model.findAll().done(function (models) {
            equal(models.length, 100, 'Got 100 models for findAll with no parameters');
            equal(models[95].name, 'Object 95', 'All models generated properly');
            Model.findOne({ id: 51 }).done(function (data) {
                equal(data.id, 51, 'Got correct object id');
                equal('Object 51', data.name, 'Object name generated correctly');
                new Model({ name: 'My test object' }).save().done(function (newmodel) {
                    equal(newmodel.id, 100, 'Id got incremented');
                    equal(newmodel.name, 'My test object');
                    Model.findOne({ id: 100 }).done(function (model) {
                        equal(model.id, 100, 'Loaded new object');
                        model.attr('name', 'Updated test object');
                        model.save().done(function (model) {
                            equal(model.name, 'Updated test object', 'Successfully updated object');
                            model.destroy().done(function (deleted) {
                                start();
                            });
                        });
                    });
                });
            });
        });
    });
    test('can.fixture.store returns 404 on findOne with bad id (#803)', function () {
        var store = can.fixture.store(2, function (i) {
                return {
                    id: i,
                    name: 'Object ' + i
                };
            }), Model = can.Model({ findOne: 'GET /models/{id}' }, {});
        can.fixture('GET /models/{id}', store.findOne);
        stop();
        Model.findOne({ id: 3 }).fail(function (data, status, statusText) {
            equal(status, 'error', 'Got an error');
            equal(statusText, 'Requested resource not found', 'Got correct status message');
            start();
        });
    });
    test('can.fixture.store returns 404 on update with a bad id (#803)', function () {
        var store = can.fixture.store(5, function (i) {
                return {
                    id: i,
                    name: 'Object ' + i
                };
            }), Model = can.Model({ update: 'POST /models/{id}' }, {});
        stop();
        can.fixture('POST /models/{id}', store.update);
        Model.update(6, { 'jedan': 'dva' }).fail(function (data, status, statusText) {
            equal(status, 'error', 'Got an error');
            equal(statusText, 'Requested resource not found', 'Got correct status message');
            start();
        });
    });
    test('can.fixture.store returns 404 on destroy with a bad id (#803)', function () {
        var store = can.fixture.store(2, function (i) {
                return {
                    id: i,
                    name: 'Object ' + i
                };
            }), Model = can.Model({ destroy: 'DELETE /models/{id}' }, {});
        stop();
        can.fixture('DELETE /models/{id}', store.destroy);
        Model.destroy(6).fail(function (data, status, statusText) {
            equal(status, 'error', 'Got an error');
            equal(statusText, 'Requested resource not found', 'Got correct status message');
            start();
        });
    });
    test('can.fixture.store can use id of different type (#742)', function () {
        var store = can.fixture.store(100, function (i) {
                return {
                    id: i,
                    parentId: i * 2,
                    name: 'Object ' + i
                };
            }), Model = can.Model({ findAll: 'GET /models' }, {});
        can.fixture('GET /models', store.findAll);
        stop();
        Model.findAll({ parentId: '4' }).done(function (models) {
            equal(models.length, 1, 'Got one model');
            deepEqual(models[0].attr(), {
                id: 2,
                parentId: 4,
                name: 'Object 2'
            });
            start();
        });
    });
    test('can.fixture with response callback', 4, function () {
        can.fixture.delay = 10;
        can.fixture('responseCb', function (orig, response) {
            response({ sweet: 'ness' });
        });
        can.fixture('responseErrorCb', function (orig, response) {
            response(404, 'This is an error from callback');
        });
        stop();
        can.ajax({
            url: 'responseCb',
            dataType: 'json'
        }).done(function (data) {
            equal(data.sweet, 'ness', 'can.get works');
            start();
        });
        stop();
        can.ajax({
            url: 'responseErrorCb',
            dataType: 'json'
        }).fail(function (orig, error, text) {
            equal(error, 'error', 'Got error status');
            equal(text, 'This is an error from callback', 'Got error text');
            start();
        });
        stop();
        can.fixture('cbWithTimeout', function (orig, response) {
            setTimeout(function () {
                response([{ epic: 'ness' }]);
            }, 10);
        });
        can.ajax({
            url: 'cbWithTimeout',
            dataType: 'json'
        }).done(function (data) {
            equal(data[0].epic, 'ness', 'Got responsen with timeout');
            start();
        });
    });
    test('store create works with an empty array of items', function () {
        var store = can.fixture.store(0, function () {
            return {};
        });
        store.create({ data: {} }, function (responseData, responseHeaders) {
            equal(responseData.id, 0, 'the first id is 0');
        });
    });
    test('store creates sequential ids', function () {
        var store = can.fixture.store(0, function () {
            return {};
        });
        store.create({ data: {} }, function (responseData, responseHeaders) {
            equal(responseData.id, 0, 'the first id is 0');
        });
        store.create({ data: {} }, function (responseData, responseHeaders) {
            equal(responseData.id, 1, 'the second id is 1');
        });
        store.destroy({ data: { id: 0 } });
        store.create({ data: {} }, function (responseData, responseHeaders) {
            equal(responseData.id, 2, 'the third id is 2');
        });
    });
    test('fixture updates request.data with id', function () {
        expect(1);
        stop();
        can.fixture('foo/{id}', function (request) {
            equal(request.data.id, 5);
            start();
        });
        can.ajax({ url: 'foo/5' });
    });
    test('create a store with array and comparison object', function () {
        var store = can.fixture.store([
            {
                id: 1,
                modelId: 1,
                year: 2013,
                name: '2013 Mustang',
                thumb: 'http://mustangsdaily.com/blog/wp-content/uploads/2012/07/01-2013-ford-mustang-gt-review-585x388.jpg'
            },
            {
                id: 2,
                modelId: 1,
                year: 2014,
                name: '2014 Mustang',
                thumb: 'http://mustangsdaily.com/blog/wp-content/uploads/2013/03/2014-roush-mustang.jpg'
            },
            {
                id: 2,
                modelId: 2,
                year: 2013,
                name: '2013 Focus',
                thumb: 'http://images.newcars.com/images/car-pictures/original/2013-Ford-Focus-Sedan-S-4dr-Sedan-Exterior.png'
            },
            {
                id: 2,
                modelId: 2,
                year: 2014,
                name: '2014 Focus',
                thumb: 'http://ipinvite.iperceptions.com/Invitations/survey705/images_V2/top4.jpg'
            },
            {
                id: 2,
                modelId: 3,
                year: 2013,
                name: '2013 Altima',
                thumb: 'http://www.blogcdn.com/www.autoblog.com/media/2012/04/04-2013-nissan-altima-1333416664.jpg'
            },
            {
                id: 2,
                modelId: 3,
                year: 2014,
                name: '2014 Altima',
                thumb: 'http://www.blogcdn.com/www.autoblog.com/media/2012/04/01-2013-nissan-altima-ny.jpg'
            },
            {
                id: 2,
                modelId: 4,
                year: 2013,
                name: '2013 Leaf',
                thumb: 'http://www.blogcdn.com/www.autoblog.com/media/2012/04/01-2013-nissan-altima-ny.jpg'
            },
            {
                id: 2,
                modelId: 4,
                year: 2014,
                name: '2014 Leaf',
                thumb: 'http://images.thecarconnection.com/med/2013-nissan-leaf_100414473_m.jpg'
            }
        ], { year: 'i' });
        can.fixture('GET /presetStore', store.findAll);
        stop();
        can.ajax({
            url: '/presetStore',
            method: 'get',
            data: {
                year: 2013,
                modelId: 1
            }
        }).then(function (response) {
            equal(response.data[0].id, 1, 'got the first item');
            equal(response.data.length, 1, 'only got one item');
            start();
        });
    });
    test('store with objects allows .create, .update and .destroy (#1471)', 6, function () {
        var store = can.fixture.store([
            {
                id: 1,
                modelId: 1,
                year: 2013,
                name: '2013 Mustang',
                thumb: 'http://mustangsdaily.com/blog/wp-content/uploads/2012/07/01-2013-ford-mustang-gt-review-585x388.jpg'
            },
            {
                id: 2,
                modelId: 1,
                year: 2014,
                name: '2014 Mustang',
                thumb: 'http://mustangsdaily.com/blog/wp-content/uploads/2013/03/2014-roush-mustang.jpg'
            },
            {
                id: 3,
                modelId: 2,
                year: 2013,
                name: '2013 Focus',
                thumb: 'http://images.newcars.com/images/car-pictures/original/2013-Ford-Focus-Sedan-S-4dr-Sedan-Exterior.png'
            },
            {
                id: 4,
                modelId: 2,
                year: 2014,
                name: '2014 Focus',
                thumb: 'http://ipinvite.iperceptions.com/Invitations/survey705/images_V2/top4.jpg'
            },
            {
                id: 5,
                modelId: 3,
                year: 2013,
                name: '2013 Altima',
                thumb: 'http://www.blogcdn.com/www.autoblog.com/media/2012/04/04-2013-nissan-altima-1333416664.jpg'
            },
            {
                id: 6,
                modelId: 3,
                year: 2014,
                name: '2014 Altima',
                thumb: 'http://www.blogcdn.com/www.autoblog.com/media/2012/04/01-2013-nissan-altima-ny.jpg'
            },
            {
                id: 7,
                modelId: 4,
                year: 2013,
                name: '2013 Leaf',
                thumb: 'http://www.blogcdn.com/www.autoblog.com/media/201204/01-2013-nissan-altima-ny.jpg'
            },
            {
                id: 8,
                modelId: 4,
                year: 2014,
                name: '2014 Leaf',
                thumb: 'http://images.thecarconnection.com/med/2013-nissan-leaf_100414473_m.jpg'
            }
        ]);
        can.fixture('GET /cars', store.findAll);
        can.fixture('POST /cars', store.create);
        can.fixture('PUT /cars/{id}', store.update);
        can.fixture('DELETE /cars/{id}', store.destroy);
        var Car = can.Model.extend({ resource: '/cars' }, {});
        stop();
        Car.findAll().then(function (cars) {
            equal(cars.length, 8, 'Got all cars');
            return cars[1].destroy();
        }).then(function () {
            return Car.findAll();
        }).then(function (cars) {
            equal(cars.length, 7, 'One car less');
            equal(cars.attr('1.name'), '2013 Focus', 'Car actually deleted');
        }).then(function () {
            var altima = new Car({
                modelId: 3,
                year: 2015,
                name: '2015 Altima'
            });
            return altima.save();
        }).then(function (saved) {
            ok(typeof saved.id !== 'undefined');
            saved.attr('name', '2015 Nissan Altima');
            return saved.save();
        }).then(function (updated) {
            equal(updated.attr('name'), '2015 Nissan Altima');
            return Car.findAll();
        }).then(function (cars) {
            equal(cars.length, 8, 'New car created');
            start();
        });
    });
    test('fixture: false flag circumvents can.fixture', function () {
        can.fixture('GET /thinger/mabobs', function (settings) {
            return { thingers: 'mabobs' };
        });
        stop();
        can.ajax({
            url: '/thinger/mabobs',
            method: 'GET',
            fixture: false,
            error: function () {
                ok(true, 'AJAX errors out as expected');
                start();
            }
        });
    });
});
/*view/bindings/bindings_test*/
define('can/view/bindings/bindings_test', function (require, exports, module) {
    var can = require('can/util/util');
    require('can/view/bindings/bindings');
    require('can/component/component');
    require('steal-qunit');
    QUnit.module('can/view/bindings', {
        setup: function () {
            document.getElementById('qunit-fixture').innerHTML = '';
        }
    });
    test('attributeNameInfo', function () {
        var info = can.bindings.getBindingInfo({
            name: 'foo',
            value: 'bar'
        }, { foo: '@' }, 'legacy');
        deepEqual(info, {
            parent: 'attribute',
            child: 'viewModel',
            parentToChild: true,
            childToParent: true,
            childName: 'foo',
            parentName: 'foo',
            bindingAttributeName: 'foo'
        }, 'legacy with @');
        info = can.bindings.getBindingInfo({
            name: 'foo-ed',
            value: 'bar'
        }, {}, 'legacy');
        deepEqual(info, {
            parent: 'scope',
            child: 'viewModel',
            parentToChild: true,
            childToParent: true,
            childName: 'fooEd',
            parentName: 'bar',
            bindingAttributeName: 'foo-ed'
        }, 'legacy');
        info = can.bindings.getBindingInfo({
            name: 'foo-ed',
            value: 'bar'
        });
        deepEqual(info, {
            parent: 'attribute',
            child: 'viewModel',
            parentToChild: true,
            childToParent: true,
            childName: 'fooEd',
            parentName: 'foo-ed',
            bindingAttributeName: 'foo-ed'
        }, 'OG stache attr binding');
        info = can.bindings.getBindingInfo({
            name: 'foo-ed',
            value: '{bar}'
        });
        deepEqual(info, {
            parent: 'scope',
            child: 'viewModel',
            parentToChild: true,
            childToParent: true,
            childName: 'fooEd',
            parentName: 'bar',
            bindingAttributeName: 'foo-ed'
        }, 'OG stache vm binding');
        info = can.bindings.getBindingInfo({
            name: '{$foo-ed}',
            value: 'bar'
        });
        deepEqual(info, {
            parent: 'scope',
            child: 'attribute',
            childToParent: false,
            parentToChild: true,
            parentName: 'bar',
            childName: 'foo-ed',
            bindingAttributeName: '{$foo-ed}',
            initializeValues: true
        }, 'new el binding');
        info = can.bindings.getBindingInfo({
            name: '{($foo-ed)}',
            value: 'bar'
        });
        deepEqual(info, {
            parent: 'scope',
            child: 'attribute',
            childToParent: true,
            parentToChild: true,
            parentName: 'bar',
            childName: 'foo-ed',
            bindingAttributeName: '{($foo-ed)}',
            initializeValues: true
        }, 'new el binding');
        info = can.bindings.getBindingInfo({
            name: '{^$foo-ed}',
            value: 'bar'
        });
        deepEqual(info, {
            parent: 'scope',
            child: 'attribute',
            childToParent: true,
            parentToChild: false,
            parentName: 'bar',
            childName: 'foo-ed',
            bindingAttributeName: '{^$foo-ed}',
            initializeValues: true
        }, 'new el binding');
        info = can.bindings.getBindingInfo({
            name: '{foo-ed}',
            value: 'bar'
        });
        deepEqual(info, {
            parent: 'scope',
            child: 'viewModel',
            parentToChild: true,
            childToParent: false,
            childName: 'fooEd',
            parentName: 'bar',
            bindingAttributeName: '{foo-ed}',
            initializeValues: true
        }, 'new vm binding');
        info = can.bindings.getBindingInfo({
            name: '{(foo-ed)}',
            value: 'bar'
        });
        deepEqual(info, {
            parent: 'scope',
            child: 'viewModel',
            parentToChild: true,
            childToParent: true,
            childName: 'fooEd',
            parentName: 'bar',
            bindingAttributeName: '{(foo-ed)}',
            initializeValues: true
        }, 'new el binding');
        info = can.bindings.getBindingInfo({
            name: '{^foo-ed}',
            value: 'bar'
        });
        deepEqual(info, {
            parent: 'scope',
            child: 'viewModel',
            parentToChild: false,
            childToParent: true,
            childName: 'fooEd',
            parentName: 'bar',
            bindingAttributeName: '{^foo-ed}',
            initializeValues: true
        }, 'new el binding');
    });
    var foodTypes = new can.List([
        {
            title: 'Fruits',
            content: 'oranges, apples'
        },
        {
            title: 'Breads',
            content: 'pasta, cereal'
        },
        {
            title: 'Sweets',
            content: 'ice cream, candy'
        }
    ]);
    if (typeof document.getElementsByClassName === 'function') {
        test('can-event handlers', function () {
            var ta = document.getElementById('qunit-fixture');
            var template = can.view.stache('<div>' + '{{#each foodTypes}}' + '<p can-click=\'doSomething\'>{{content}}</p>' + '{{/each}}' + '</div>');
            function doSomething(foodType, el, ev) {
                ok(true, 'doSomething called');
                equal(el[0].nodeName.toLowerCase(), 'p', 'this is the element');
                equal(ev.type, 'click', '1st argument is the event');
                equal(foodType, foodTypes[0], '2nd argument is the 1st foodType');
            }
            var frag = template({
                foodTypes: foodTypes,
                doSomething: doSomething
            });
            ta.appendChild(frag);
            var p0 = ta.getElementsByTagName('p')[0];
            can.trigger(p0, 'click');
        });
        test('can-event special keys', function () {
            var scope = new can.Map({ test: 'testval' });
            var ta = document.getElementById('qunit-fixture');
            can.Component.extend({
                tag: 'can-event-args-tester',
                scope: scope
            });
            var template = can.view.stache('<div>' + '{{#each foodTypes}}' + '<can-event-args-tester class=\'with-args\' can-click=\'{withArgs @event @element @viewModel @viewModel.test . title content=content}\'/>' + '{{/each}}' + '</div>');
            function withArgs(ev1, el1, compScope, testVal, context, title, hash) {
                ok(true, 'withArgs called');
                equal(el1[0].nodeName.toLowerCase(), 'can-event-args-tester', '@element is the event\'s DOM element');
                equal(ev1.type, 'click', '@event is the click event');
                equal(scope, compScope, 'Component scope accessible through @viewModel');
                equal(testVal, scope.attr('test'), 'Attributes accessible');
                equal(context.title, foodTypes[0].title, 'Context passed in');
                equal(title, foodTypes[0].title, 'Title passed in');
                equal(hash.content, foodTypes[0].content, 'Args with = passed in as a hash');
            }
            var frag = template({
                foodTypes: foodTypes,
                withArgs: withArgs
            });
            ta.innerHTML = '';
            ta.appendChild(frag);
            var p0 = ta.getElementsByClassName('with-args')[0];
            can.trigger(p0, 'click');
        });
        test('(event) handlers', function () {
            var ta = document.getElementById('qunit-fixture');
            var template = can.view.stache('<div>' + '{{#each foodTypes}}' + '<p ($click)=\'doSomething\'>{{content}}</p>' + '{{/each}}' + '</div>');
            var foodTypes = new can.List([
                {
                    title: 'Fruits',
                    content: 'oranges, apples'
                },
                {
                    title: 'Breads',
                    content: 'pasta, cereal'
                },
                {
                    title: 'Sweets',
                    content: 'ice cream, candy'
                }
            ]);
            function doSomething(foodType, el, ev) {
                ok(true, 'doSomething called');
                equal(el[0].nodeName.toLowerCase(), 'p', 'this is the element');
                equal(ev.type, 'click', '1st argument is the event');
                equal(foodType, foodTypes[0], '2nd argument is the 1st foodType');
            }
            var frag = template({
                foodTypes: foodTypes,
                doSomething: doSomething
            });
            ta.appendChild(frag);
            var p0 = ta.getElementsByTagName('p')[0];
            can.trigger(p0, 'click');
            var scope = new can.Map({ test: 'testval' });
            can.Component.extend({
                tag: 'fancy-event-args-tester',
                scope: scope
            });
            template = can.view.stache('<div>' + '{{#each foodTypes}}' + '<fancy-event-args-tester class=\'with-args\' (click)=\'withArgs @event @element @viewModel @viewModel.test . title content=content\'/>' + '{{/each}}' + '</div>');
            function withArgs(ev1, el1, compScope, testVal, context, title, hash) {
                ok(true, 'withArgs called');
                equal(el1[0].nodeName.toLowerCase(), 'fancy-event-args-tester', '@element is the event\'s DOM element');
                equal(ev1.type, 'click', '@event is the click event');
                equal(scope, compScope, 'Component scope accessible through @viewModel');
                equal(testVal, scope.attr('test'), 'Attributes accessible');
                equal(context.title, foodTypes[0].title, 'Context passed in');
                equal(title, foodTypes[0].title, 'Title passed in');
                equal(hash.content, foodTypes[0].content, 'Args with = passed in as a hash');
            }
            frag = template({
                foodTypes: foodTypes,
                withArgs: withArgs
            });
            ta.innerHTML = '';
            ta.appendChild(frag);
            p0 = ta.getElementsByClassName('with-args')[0];
            can.trigger(p0, 'click');
        });
    }
    if (window.jQuery) {
        test('can-event passes extra args to handler', function () {
            expect(3);
            var template = can.view.stache('<p can-myevent=\'handleMyEvent\'>{{content}}</p>');
            var frag = template({
                handleMyEvent: function (context, el, event, arg1, arg2) {
                    ok(true, 'handleMyEvent called');
                    equal(arg1, 'myarg1', '3rd argument is the extra event args');
                    equal(arg2, 'myarg2', '4rd argument is the extra event args');
                }
            });
            var ta = document.getElementById('qunit-fixture');
            ta.appendChild(frag);
            var p0 = ta.getElementsByTagName('p')[0];
            can.trigger(p0, 'myevent', [
                'myarg1',
                'myarg2'
            ]);
        });
    }
    test('can-value input text', function () {
        var template = can.view.stache('<input can-value=\'age\'/>');
        var map = new can.Map();
        var frag = template(map);
        var ta = document.getElementById('qunit-fixture');
        ta.appendChild(frag);
        var input = ta.getElementsByTagName('input')[0];
        equal(input.value, '', 'input value set correctly if key does not exist in map');
        map.attr('age', '30');
        equal(input.value, '30', 'input value set correctly');
        map.attr('age', '31');
        equal(input.value, '31', 'input value update correctly');
        input.value = '32';
        can.trigger(input, 'change');
        equal(map.attr('age'), '32', 'updated from input');
    });
    test('can-value with spaces (#1477)', function () {
        var template = can.view.stache('<input can-value=\'{ age }\'/>');
        var map = new can.Map();
        var frag = template(map);
        var ta = document.getElementById('qunit-fixture');
        ta.appendChild(frag);
        var input = ta.getElementsByTagName('input')[0];
        equal(input.value, '', 'input value set correctly if key does not exist in map');
        map.attr('age', '30');
        equal(input.value, '30', 'input value set correctly');
        map.attr('age', '31');
        equal(input.value, '31', 'input value update correctly');
        input.value = '32';
        can.trigger(input, 'change');
        equal(map.attr('age'), '32', 'updated from input');
    });
    test('can-value input radio', function () {
        var template = can.view.stache('<input type=\'radio\' can-value=\'color\' value=\'red\'/> Red<br/>' + '<input type=\'radio\' can-value=\'color\' value=\'green\'/> Green<br/>');
        var map = new can.Map({ color: 'red' });
        var frag = template(map);
        var ta = document.getElementById('qunit-fixture');
        ta.appendChild(frag);
        var inputs = ta.getElementsByTagName('input');
        ok(inputs[0].checked, 'first input checked');
        ok(!inputs[1].checked, 'second input not checked');
        map.attr('color', 'green');
        ok(!inputs[0].checked, 'first notinput checked');
        ok(inputs[1].checked, 'second input checked');
        inputs[0].checked = true;
        inputs[1].checked = false;
        can.trigger(inputs[0], 'change');
        equal(map.attr('color'), 'red', 'updated from input');
    });
    test('can-enter', function () {
        var template = can.view.stache('<input can-enter=\'update\'/>');
        var called = 0;
        var frag = template({
            update: function () {
                called++;
                ok(called, 1, 'update called once');
            }
        });
        var input = frag.childNodes[0];
        can.trigger(input, {
            type: 'keyup',
            keyCode: 38
        });
        can.trigger(input, {
            type: 'keyup',
            keyCode: 13
        });
    });
    test('two bindings on one element call back the correct method', function () {
        expect(2);
        var template = can.stache('<input can-mousemove=\'first\' can-click=\'second\'/>');
        var callingFirst = false, callingSecond = false;
        var frag = template({
            first: function () {
                ok(callingFirst, 'called first');
            },
            second: function () {
                ok(callingSecond, 'called second');
            }
        });
        var input = frag.childNodes[0];
        callingFirst = true;
        can.trigger(input, { type: 'mousemove' });
        callingFirst = false;
        callingSecond = true;
        can.trigger(input, { type: 'click' });
    });
    asyncTest('can-value select remove from DOM', function () {
        expect(1);
        var template = can.view.stache('<select can-value=\'color\'>' + '<option value=\'red\'>Red</option>' + '<option value=\'green\'>Green</option>' + '</select>'), frag = template(), ta = document.getElementById('qunit-fixture');
        ta.appendChild(frag);
        can.remove(can.$('select', ta));
        setTimeout(function () {
            start();
            ok(true, 'Nothing should break if we just add and then remove the select');
        }, 10);
    });
    test('checkboxes with can-value bind properly (#628)', function () {
        var data = new can.Map({ completed: true }), frag = can.view.stache('<input type="checkbox" can-value="completed"/>')(data);
        can.append(can.$('#qunit-fixture'), frag);
        var input = can.$('#qunit-fixture')[0].getElementsByTagName('input')[0];
        equal(input.checked, data.attr('completed'), 'checkbox value bound (via attr check)');
        data.attr('completed', false);
        equal(input.checked, data.attr('completed'), 'checkbox value bound (via attr uncheck)');
        input.checked = true;
        can.trigger(input, 'change');
        equal(input.checked, true, 'checkbox value bound (via check)');
        equal(data.attr('completed'), true, 'checkbox value bound (via check)');
        input.checked = false;
        can.trigger(input, 'change');
        equal(input.checked, false, 'checkbox value bound (via uncheck)');
        equal(data.attr('completed'), false, 'checkbox value bound (via uncheck)');
    });
    test('checkboxes with can-true-value bind properly', function () {
        var data = new can.Map({ sex: 'male' }), frag = can.view.stache('<input type="checkbox" can-value="sex" can-true-value="male" can-false-value="female"/>')(data);
        can.append(can.$('#qunit-fixture'), frag);
        var input = can.$('#qunit-fixture')[0].getElementsByTagName('input')[0];
        equal(input.checked, true, 'checkbox value bound (via attr check)');
        data.attr('sex', 'female');
        equal(input.checked, false, 'checkbox value unbound (via attr uncheck)');
        input.checked = true;
        can.trigger(input, 'change');
        equal(input.checked, true, 'checkbox value bound (via check)');
        equal(data.attr('sex'), 'male', 'checkbox value bound (via check)');
        input.checked = false;
        can.trigger(input, 'change');
        equal(input.checked, false, 'checkbox value bound (via uncheck)');
        equal(data.attr('sex'), 'female', 'checkbox value bound (via uncheck)');
    });
    test('can-value select single', function () {
        var template = can.view.stache('<select can-value=\'color\'>' + '<option value=\'red\'>Red</option>' + '<option value=\'green\'>Green</option>' + '</select>');
        var map = new can.Map({ color: 'red' });
        var frag = template(map);
        var ta = document.getElementById('qunit-fixture');
        ta.appendChild(frag);
        var inputs = ta.getElementsByTagName('select');
        equal(inputs[0].value, 'red', 'default value set');
        map.attr('color', 'green');
        equal(inputs[0].value, 'green', 'alternate value set');
        can.each(document.getElementsByTagName('option'), function (opt) {
            if (opt.value === 'red') {
                opt.selected = 'selected';
            }
        });
        equal(map.attr('color'), 'green', 'not yet updated from input');
        can.trigger(inputs[0], 'change');
        equal(map.attr('color'), 'red', 'updated from input');
        can.each(document.getElementsByTagName('option'), function (opt) {
            if (opt.value === 'green') {
                opt.selected = 'selected';
            }
        });
        equal(map.attr('color'), 'red', 'not yet updated from input');
        can.trigger(inputs[0], 'change');
        equal(map.attr('color'), 'green', 'updated from input');
    });
    test('can-value select multiple with values seperated by a ;', function () {
        var template = can.view.stache('<select can-value=\'color\' multiple>' + '<option value=\'red\'>Red</option>' + '<option value=\'green\'>Green</option>' + '<option value=\'ultraviolet\'>Ultraviolet</option>' + '</select>');
        var map = new can.Map({ color: 'red' });
        stop();
        var frag = template(map);
        var ta = document.getElementById('qunit-fixture');
        ta.appendChild(frag);
        var inputs = ta.getElementsByTagName('select'), options = inputs[0].getElementsByTagName('option');
        setTimeout(function () {
            equal(inputs[0].value, 'red', 'default value set');
            map.attr('color', 'green');
            equal(inputs[0].value, 'green', 'alternate value set');
            options[0].selected = true;
            equal(map.attr('color'), 'green', 'not yet updated from input');
            can.trigger(inputs[0], 'change');
            equal(map.attr('color'), 'red;green', 'updated from input');
            map.removeAttr('color');
            equal(inputs[0].value, '', 'attribute removed from map');
            options[1].selected = true;
            can.trigger(inputs[0], 'change');
            equal(map.attr('color'), 'green', 'updated from input');
            map.attr('color', 'red;green');
            ok(options[0].selected, 'red option selected from map');
            ok(options[1].selected, 'green option selected from map');
            ok(!options[2].selected, 'ultraviolet option NOT selected from map');
            can.remove(can.$(inputs));
            start();
        }, 1);
    });
    test('can-value select multiple with values cross bound to an array', function () {
        var template = can.view.stache('<select can-value=\'colors\' multiple>' + '<option value=\'red\'>Red</option>' + '<option value=\'green\'>Green</option>' + '<option value=\'ultraviolet\'>Ultraviolet</option>' + '</select>');
        var map = new can.Map({});
        stop();
        var frag = template(map);
        var ta = document.getElementById('qunit-fixture');
        ta.appendChild(frag);
        var select = ta.getElementsByTagName('select')[0], options = select.getElementsByTagName('option');
        setTimeout(function () {
            options[0].selected = true;
            can.trigger(select, 'change');
            deepEqual(map.attr('colors').attr(), ['red'], 'A can.List property is set even if none existed');
            options[1].selected = true;
            can.trigger(select, 'change');
            deepEqual(map.attr('colors').attr(), [
                'red',
                'green'
            ], 'Adds items to the list');
            options[0].selected = false;
            can.trigger(select, 'change');
            deepEqual(map.attr('colors').attr(), ['green'], 'Removes items from the list');
            map.attr('colors').push('ultraviolet');
            options[0].selected = false;
            options[1].selected = true;
            options[2].selected = true;
            can.remove(can.$(select));
            start();
        }, 1);
    });
    test('can-value multiple select with a can.List', function () {
        var template = can.view.stache('<select can-value=\'colors\' multiple>' + '<option value=\'red\'>Red</option>' + '<option value=\'green\'>Green</option>' + '<option value=\'ultraviolet\'>Ultraviolet</option>' + '</select>');
        var list = new can.List();
        stop();
        var frag = template({ colors: list });
        var ta = document.getElementById('qunit-fixture');
        ta.appendChild(frag);
        var select = ta.getElementsByTagName('select')[0], options = select.getElementsByTagName('option');
        setTimeout(function () {
            options[0].selected = true;
            can.trigger(select, 'change');
            deepEqual(list.attr(), ['red'], 'A can.List property is set even if none existed');
            options[1].selected = true;
            can.trigger(select, 'change');
            deepEqual(list.attr(), [
                'red',
                'green'
            ], 'Adds items to the list');
            options[0].selected = false;
            can.trigger(select, 'change');
            deepEqual(list.attr(), ['green'], 'Removes items from the list');
            list.push('ultraviolet');
            options[0].selected = false;
            options[1].selected = true;
            options[2].selected = true;
            can.remove(can.$(select));
            start();
        }, 1);
    });
    test('can-value contenteditable', function () {
        var template = can.view.stache('<div id=\'cdiv\' contenteditable can-value=\'age\'></div>');
        var map = new can.Map();
        var frag = template(map);
        var ta = document.getElementById('qunit-fixture');
        ta.appendChild(frag);
        var div = document.getElementById('cdiv');
        equal(div.innerHTML, '', 'contenteditable set correctly if key does not exist in map');
        map.attr('age', '30');
        equal(div.innerHTML, '30', 'contenteditable set correctly');
        map.attr('age', '31');
        equal(div.innerHTML, '31', 'contenteditable update correctly');
        div.innerHTML = '32';
        can.trigger(div, 'blur');
        equal(map.attr('age'), '32', 'updated from contenteditable');
    });
    test('can-event handlers work with {} (#905)', function () {
        expect(4);
        var template = can.stache('<div>' + '{{#each foodTypes}}' + '<p can-click=\'{doSomething}\'>{{content}}</p>' + '{{/each}}' + '</div>');
        var foodTypes = new can.List([
            {
                title: 'Fruits',
                content: 'oranges, apples'
            },
            {
                title: 'Breads',
                content: 'pasta, cereal'
            },
            {
                title: 'Sweets',
                content: 'ice cream, candy'
            }
        ]);
        var doSomething = function (foodType, el, ev) {
            ok(true, 'doSomething called');
            equal(el[0].nodeName.toLowerCase(), 'p', 'this is the element');
            equal(ev.type, 'click', '1st argument is the event');
            equal(foodType, foodTypes[0], '2nd argument is the 1st foodType');
        };
        var frag = template({
            foodTypes: foodTypes,
            doSomething: doSomething
        });
        var ta = document.getElementById('qunit-fixture');
        ta.appendChild(frag);
        var p0 = ta.getElementsByTagName('p')[0];
        can.trigger(p0, 'click');
    });
    test('can-value works with {} (#905)', function () {
        var template = can.stache('<input can-value=\'{age}\'/>');
        var map = new can.Map();
        var frag = template(map);
        var ta = document.getElementById('qunit-fixture');
        ta.appendChild(frag);
        var input = ta.getElementsByTagName('input')[0];
        equal(input.value, '', 'input value set correctly if key does not exist in map');
        map.attr('age', '30');
        equal(input.value, '30', 'input value set correctly');
        map.attr('age', '31');
        equal(input.value, '31', 'input value update correctly');
        input.value = '32';
        can.trigger(input, 'change');
        equal(map.attr('age'), '32', 'updated from input');
    });
    test('can-value select with null or undefined value (#813)', function () {
        var template = can.view.stache('<select id=\'null-select\' can-value=\'color-1\'>' + '<option value=\'\'>Choose</option>' + '<option value=\'red\'>Red</option>' + '<option value=\'green\'>Green</option>' + '</select>' + '<select id=\'undefined-select\' can-value=\'color-2\'>' + '<option value=\'\'>Choose</option>' + '<option value=\'red\'>Red</option>' + '<option value=\'green\'>Green</option>' + '</select>');
        var map = new can.Map({
            'color-1': null,
            'color-2': undefined
        });
        stop();
        var frag = template(map);
        var ta = document.getElementById('qunit-fixture');
        ta.appendChild(frag);
        var nullInput = document.getElementById('null-select');
        var nullInputOptions = nullInput.getElementsByTagName('option');
        var undefinedInput = document.getElementById('undefined-select');
        var undefinedInputOptions = undefinedInput.getElementsByTagName('option');
        setTimeout(function () {
            ok(nullInputOptions[0].selected, 'default (null) value set');
            ok(undefinedInputOptions[0].selected, 'default (undefined) value set');
            start();
        }, 1);
    });
    test('radio type conversion (#811)', function () {
        var data = new can.Map({ id: 1 }), frag = can.view.stache('<input type="radio" can-value="id" value="1"/>')(data);
        can.append(can.$('#qunit-fixture'), frag);
        var input = can.$('#qunit-fixture')[0].getElementsByTagName('input')[0];
        ok(input.checked, 'checkbox value bound');
    });
    test('template with view binding breaks in stache, not in mustache (#966)', function () {
        var templateString = '<a href="javascript://" can-click="select">' + '{{#if thing}}\n<div />{{/if}}' + '<span>{{name}}</span>' + '</a>';
        var stacheRenderer = can.stache(templateString);
        var obj = new can.Map({ thing: 'stuff' });
        stacheRenderer(obj);
        ok(true, 'stache worked without errors');
    });
    test('can-event throws an error when inside #if block (#1182)', function () {
        var flag = can.compute(false), clickHandlerCount = 0;
        var frag = can.view.stache('<div {{#if flag}}can-click=\'foo\'{{/if}}>Click</div>')({
            flag: flag,
            foo: function () {
                clickHandlerCount++;
            }
        });
        var trig = function () {
            var div = can.$('#qunit-fixture')[0].getElementsByTagName('div')[0];
            can.trigger(div, { type: 'click' });
        };
        can.append(can.$('#qunit-fixture'), frag);
        trig();
        equal(clickHandlerCount, 0, 'click handler not called');
    });
    test('can-value compute rejects new value (#887)', function () {
        var template = can.view.stache('<input can-value=\'age\'/>');
        var compute = can.compute(30, function (newVal, oldVal) {
            if (isNaN(+newVal)) {
                return oldVal;
            } else {
                return +newVal;
            }
        });
        var frag = template({ age: compute });
        var ta = document.getElementById('qunit-fixture');
        ta.appendChild(frag);
        var input = ta.getElementsByTagName('input')[0];
        input.value = '30f';
        can.trigger(input, 'change');
        equal(compute(), 30, 'Still the old value');
        equal(input.value, '30', 'Text input has also not changed');
    });
    test('can-value select multiple applies initial value, when options rendered from array (#1414)', function () {
        var template = can.view.stache('<select can-value=\'colors\' multiple>' + '{{#each allColors}}<option value=\'{{value}}\'>{{label}}</option>{{/each}}' + '</select>');
        var map = new can.Map({
            colors: [
                'red',
                'green'
            ],
            allColors: [
                {
                    value: 'red',
                    label: 'Red'
                },
                {
                    value: 'green',
                    label: 'Green'
                },
                {
                    value: 'blue',
                    label: 'Blue'
                }
            ]
        });
        stop();
        var frag = template(map);
        var ta = document.getElementById('qunit-fixture');
        ta.appendChild(frag);
        var select = ta.getElementsByTagName('select')[0], options = select.getElementsByTagName('option');
        setTimeout(function () {
            ok(options[0].selected, 'red should be set initially');
            ok(options[1].selected, 'green should be set initially');
            ok(!options[2].selected, 'blue should not be set initially');
            start();
        }, 1);
    });
    test('can-value with truthy and falsy values binds to checkbox (#1478)', function () {
        var data = new can.Map({ completed: 1 }), frag = can.view.stache('<input type="checkbox" can-value="completed"/>')(data);
        can.append(can.$('#qunit-fixture'), frag);
        var input = can.$('#qunit-fixture')[0].getElementsByTagName('input')[0];
        equal(input.checked, true, 'checkbox value bound (via attr check)');
        data.attr('completed', 0);
        equal(input.checked, false, 'checkbox value bound (via attr check)');
    });
    test('can-EVENT can call intermediate functions before calling the final function (#1474)', function () {
        var ta = document.getElementById('qunit-fixture');
        var template = can.view.stache('<div id=\'click-me\' can-click=\'{does.some.thing}\'></div>');
        var frag = template({
            does: function () {
                return {
                    some: function () {
                        return {
                            thing: function (context) {
                                ok(can.isFunction(context.does));
                                start();
                            }
                        };
                    }
                };
            }
        });
        stop();
        ta.appendChild(frag);
        can.trigger(document.getElementById('click-me'), 'click');
    });
    test('by default can-EVENT calls with values, not computes', function () {
        stop();
        var ta = document.getElementById('qunit-fixture');
        var template = can.stache('<div id=\'click-me\' can-click=\'{map.method one map.two map.three}\'></div>');
        var one = can.compute(1);
        var three = can.compute(3);
        var MyMap = can.Map.extend({
            method: function (ONE, two, three) {
                equal(ONE, 1);
                equal(two, 2);
                equal(three, 3);
                equal(this, map, 'this set right');
                start();
            }
        });
        var map = new MyMap({
            'two': 2,
            'three': three
        });
        var frag = template({
            one: one,
            map: map
        });
        ta.appendChild(frag);
        can.trigger(document.getElementById('click-me'), 'click');
    });
    test('Conditional can-EVENT bindings are bound/unbound', 2, function () {
        var state = new can.Map({
            enableClick: true,
            clickHandler: function () {
                ok(true, '"click" was handled');
            }
        });
        var template = can.stache('<button id="find-me" {{#if enableClick}}can-click="{clickHandler}"{{/if}}></button>');
        var frag = template(state);
        var sandbox = document.getElementById('qunit-fixture');
        sandbox.appendChild(frag);
        var btn = document.getElementById('find-me');
        can.trigger(btn, 'click');
        state.attr('enableClick', false);
        stop();
        setTimeout(function () {
            can.trigger(btn, 'click');
            state.attr('enableClick', true);
            setTimeout(function () {
                can.trigger(btn, 'click');
                start();
            }, 10);
        }, 10);
    });
    test('<select can-value={value}> with undefined value selects option without value', function () {
        var template = can.view.stache('<select can-value=\'opt\'><option>Loading...</option></select>');
        var map = new can.Map();
        var frag = template(map);
        var ta = document.getElementById('qunit-fixture');
        ta.appendChild(frag);
        var select = ta.childNodes[0];
        QUnit.equal(select.selectedIndex, 0, 'Got selected index');
    });
    test('<select can-value> keeps its value as <option>s change with {{#list}} (#1762)', function () {
        var template = can.view.stache('<select can-value=\'{id}\'>{{#values}}<option value=\'{{.}}\'>{{.}}</option>{{/values}}</select>');
        var values = can.compute([
            '1',
            '2',
            '3',
            '4'
        ]);
        var id = can.compute('2');
        var frag = template({
            values: values,
            id: id
        });
        stop();
        var select = frag.firstChild;
        setTimeout(function () {
            ok(select.childNodes[1].selected, 'value is initially selected');
            values([
                '7',
                '2',
                '5',
                '4'
            ]);
            ok(select.childNodes[1].selected, 'after changing options, value should still be selected');
            start();
        }, 20);
    });
    test('<select can-value> keeps its value as <option>s change with {{#each}} (#1762)', function () {
        var template = can.view.stache('<select can-value=\'{id}\'>{{#each values}}<option value=\'{{.}}\'>{{.}}</option>{{/values}}</select>');
        var values = can.compute([
            '1',
            '2',
            '3',
            '4'
        ]);
        var id = can.compute('2');
        var frag = template({
            values: values,
            id: id
        });
        stop();
        var select = frag.firstChild;
        setTimeout(function () {
            ok(select.childNodes[1].selected, 'value is initially selected');
            values([
                '7',
                '2',
                '5',
                '4'
            ]);
            ok(select.childNodes[1].selected, 'after changing options, value should still be selected');
            start();
        }, 20);
    });
    test('(event) methods on objects are called (#1839)', function () {
        var template = can.stache('<div ($click)=\'setSomething person.message\'/>');
        var data = {
            setSomething: function (message) {
                equal(message, 'Matthew P finds good bugs');
                equal(this, data, 'setSomething called with correct scope');
            },
            person: {
                name: 'Matthew P',
                message: function () {
                    return this.name + ' finds good bugs';
                }
            }
        };
        var frag = template(data);
        can.trigger(frag.firstChild, 'click');
    });
    test('(event) methods on objects are called with call expressions (#1839)', function () {
        var template = can.stache('<div ($click)=\'setSomething(person.message)\'/>');
        var data = {
            setSomething: function (message) {
                equal(message, 'Matthew P finds good bugs');
                equal(this, data, 'setSomething called with correct scope');
            },
            person: {
                name: 'Matthew P',
                message: function () {
                    return this.name + ' finds good bugs';
                }
            }
        };
        var frag = template(data);
        can.trigger(frag.firstChild, 'click');
    });
    test('two way - viewModel (#1700)', function () {
        can.Component.extend({ tag: 'view-model-able' });
        var template = can.stache('<div {(view-model-prop)}=\'scopeProp\'/>');
        var attrSetCalled = 0;
        var map = new can.Map({ scopeProp: 'Hello' });
        var oldAttr = map.attr;
        map.attr = function (attrName, value) {
            if (typeof attrName === 'string' && arguments.length > 1) {
                attrSetCalled++;
            }
            return oldAttr.apply(this, arguments);
        };
        var frag = template(map);
        var viewModel = can.viewModel(frag.firstChild);
        equal(attrSetCalled, 0, 'set is not called on scope map');
        equal(viewModel.attr('viewModelProp'), 'Hello', 'initial value set');
        viewModel = can.viewModel(frag.firstChild);
        var viewModelAttrSetCalled = 1;
        viewModel.attr = function (attrName) {
            if (typeof attrName === 'string' && arguments.length > 1) {
                viewModelAttrSetCalled++;
            }
            return oldAttr.apply(this, arguments);
        };
        viewModel.attr('viewModelProp', 'HELLO');
        equal(map.attr('scopeProp'), 'HELLO', 'binding from child to parent');
        equal(attrSetCalled, 1, 'set is called once on scope map');
        equal(viewModelAttrSetCalled, 3, 'set is called once viewModel');
        map.attr('scopeProp', 'WORLD');
        equal(viewModel.attr('viewModelProp'), 'WORLD', 'binding from parent to child');
        equal(attrSetCalled, 2, 'set is called once on scope map');
        equal(viewModelAttrSetCalled, 4, 'set is called once on viewModel');
    });
    test('two-way - DOM - input text (#1700)', function () {
        var template = can.view.stache('<input {($value)}=\'age\'/>');
        var map = new can.Map();
        var frag = template(map);
        var ta = document.getElementById('qunit-fixture');
        ta.appendChild(frag);
        var input = ta.getElementsByTagName('input')[0];
        equal(input.value, '', 'input value set correctly if key does not exist in map');
        map.attr('age', '30');
        equal(input.value, '30', 'input value set correctly');
        map.attr('age', '31');
        equal(input.value, '31', 'input value update correctly');
        input.value = '32';
        can.trigger(input, 'change');
        equal(map.attr('age'), '32', 'updated from input');
    });
    test('two-way - DOM - {($checked)} with truthy and falsy values binds to checkbox (#1700)', function () {
        var data = new can.Map({ completed: 1 }), frag = can.view.stache('<input type="checkbox" {($checked)}="completed"/>')(data);
        can.append(can.$('#qunit-fixture'), frag);
        var input = can.$('#qunit-fixture')[0].getElementsByTagName('input')[0];
        equal(input.checked, true, 'checkbox value bound (via attr check)');
        data.attr('completed', 0);
        equal(input.checked, false, 'checkbox value bound (via attr check)');
    });
    test('two-way - reference - {(child)}="*ref" (#1700)', function () {
        var data = new can.Map({ person: { name: {} } });
        can.Component.extend({
            tag: 'reference-export',
            viewModel: { tag: 'reference-export' }
        });
        can.Component.extend({
            tag: 'ref-import',
            viewModel: { tag: 'ref-import' }
        });
        var template = can.stache('<reference-export {(name)}=\'*refName\'/>' + '<ref-import {(name)}=\'*refName\'/> {{helperToGetScope}}');
        var scope;
        var frag = template(data, {
            helperToGetScope: function (options) {
                scope = options.scope;
            }
        });
        var refExport = can.viewModel(frag.firstChild);
        var refImport = can.viewModel(frag.firstChild.nextSibling);
        refExport.attr('name', 'v1');
        equal(scope.getRefs()._context.attr('*refName'), 'v1', 'reference scope updated');
        equal(refImport.attr('name'), 'v1', 'updated ref-import');
        refImport.attr('name', 'v2');
        equal(refExport.attr('name'), 'v2', 'updated ref-export');
        equal(scope.getRefs()._context.attr('*refName'), 'v2', 'actually put in refs scope');
    });
    test('two-way - reference - with <content> tag', function () {
        can.Component.extend({
            tag: 'other-export',
            viewModel: { name: 'OTHER-EXPORT' }
        });
        can.Component.extend({
            tag: 'ref-export',
            template: can.stache('<other-export {(name)}="*otherExport"/><content>{{*otherExport}}</content>')
        });
        var t1 = can.stache('<ref-export></ref-export>');
        var f1 = t1();
        equal(can.viewModel(f1.firstChild.firstChild).attr('name'), 'OTHER-EXPORT', 'viewModel set correctly');
        equal(f1.firstChild.lastChild.nodeValue, 'OTHER-EXPORT', 'content');
    });
    test('two-way - reference shorthand (#1700)', function () {
        var data = new can.Map({ person: { name: {} } });
        can.Component.extend({
            tag: 'reference-export',
            template: can.stache('<span>{{*referenceExport.name}}</span>'),
            viewModel: {}
        });
        var template = can.stache('{{#person}}{{#name}}' + '<reference-export *reference-export/>' + '{{/name}}{{/person}}<span>{{*referenceExport.name}}</span>');
        var frag = template(data);
        var refExport = can.viewModel(frag.firstChild);
        refExport.attr('name', 'done');
        equal(frag.lastChild.firstChild.nodeValue, 'done');
        equal(frag.firstChild.firstChild.firstChild.nodeValue, '', 'not done');
    });
    test('one-way - parent to child - viewModel', function () {
        var template = can.stache('<div {view-model-prop}=\'scopeProp\'/>');
        var map = new can.Map({ scopeProp: 'Venus' });
        var frag = template(map);
        var viewModel = can.viewModel(frag.firstChild);
        equal(viewModel.attr('viewModelProp'), 'Venus', 'initial value set');
        viewModel.attr('viewModelProp', 'Earth');
        equal(map.attr('scopeProp'), 'Venus', 'no binding from child to parent');
        map.attr('scopeProp', 'Mars');
        equal(viewModel.attr('viewModelProp'), 'Mars', 'binding from parent to child');
    });
    test('one-way - child to parent - viewModel', function () {
        can.Component.extend({
            tag: 'view-model-able',
            viewModel: { viewModelProp: 'Mercury' }
        });
        var template = can.stache('<view-model-able {^view-model-prop}=\'scopeProp\'/>');
        var map = new can.Map({ scopeProp: 'Venus' });
        var frag = template(map);
        var viewModel = can.viewModel(frag.firstChild);
        equal(viewModel.attr('viewModelProp'), 'Mercury', 'initial value kept');
        equal(map.attr('scopeProp'), 'Mercury', 'initial value set on parent');
        viewModel.attr('viewModelProp', 'Earth');
        equal(map.attr('scopeProp'), 'Earth', 'binding from child to parent');
        map.attr('scopeProp', 'Mars');
        equal(viewModel.attr('viewModelProp'), 'Earth', 'no binding from parent to child');
    });
    test('one way - child to parent - importing viewModel {^.}="test"', function () {
        can.Component.extend({
            tag: 'import-scope',
            template: can.stache('Hello {{name}}'),
            viewModel: {
                name: 'David',
                age: 7
            }
        });
        can.Component.extend({
            tag: 'import-parent',
            template: can.stache('<import-scope {^.}="test"></import-scope>' + '<div>Imported: {{test.name}} {{test.age}}</div>')
        });
        var template = can.stache('<import-parent></import-parent>');
        var frag = template({});
        equal(frag.childNodes[0].childNodes[1].innerHTML, 'Imported: David 7', '{.} component scope imported into variable');
    });
    test('one way - child to parent - importing viewModel {^prop}="test"', function () {
        can.Component.extend({
            tag: 'import-prop-scope',
            template: can.stache('Hello {{name}}'),
            viewModel: {
                name: 'David',
                age: 7
            }
        });
        can.Component.extend({
            tag: 'import-prop-parent',
            template: can.stache('<import-prop-scope {^name}="test"></import-prop-scope>' + '<div>Imported: {{test}}</div>')
        });
        var template = can.stache('<import-prop-parent></import-prop-parent>');
        var frag = template({});
        equal(frag.childNodes[0].childNodes[1].innerHTML, 'Imported: David', '{name} component scope imported into variable');
    });
    test('one way - child to parent - importing viewModel {^hypenated-prop}="test"', function () {
        can.Component.extend({
            tag: 'import-prop-scope',
            template: can.stache('Hello {{userName}}'),
            viewModel: {
                userName: 'David',
                age: 7,
                updateName: function () {
                    this.attr('userName', 'Justin');
                }
            }
        });
        can.Component.extend({
            tag: 'import-prop-parent',
            template: can.stache('<import-prop-scope {^user-name}="test" {^.}="childComponent"></import-prop-scope>' + '<div>Imported: {{test}}</div>')
        });
        var template = can.stache('<import-prop-parent></import-prop-parent>');
        var frag = template({});
        var importPropParent = frag.firstChild;
        var importPropScope = importPropParent.getElementsByTagName('import-prop-scope')[0];
        can.viewModel(importPropScope).updateName();
        var importPropParentViewModel = can.viewModel(importPropParent);
        equal(importPropParentViewModel.attr('test'), 'Justin', 'got hypenated prop');
        equal(importPropParentViewModel.attr('childComponent'), can.viewModel(importPropScope), 'got view model');
    });
    test('one-way - child to parent - parent that does not leak scope, but has no template', function () {
        can.Component.extend({
            tag: 'outer-noleak',
            viewModel: { isOuter: true },
            leakScope: false
        });
        can.Component.extend({
            tag: 'my-child',
            viewModel: { isChild: true },
            leakScope: false
        });
        var template = can.stache('<outer-noleak><my-child {^.}=\'myChild\'/></outer-noleak>');
        var frag = template();
        var vm = can.viewModel(frag.firstChild);
        ok(vm.attr('myChild') instanceof can.Map, 'got instance');
    });
    test('viewModel binding (event)', function () {
        can.Component.extend({
            tag: 'viewmodel-binding',
            viewModel: {
                makeMyEvent: function () {
                    this.dispatch('myevent');
                }
            }
        });
        var frag = can.stache('<viewmodel-binding (myevent)=\'doSomething()\'/>')({
            doSomething: function () {
                ok(true, 'called!');
            }
        });
        can.viewModel(frag.firstChild).makeMyEvent();
    });
    test('checkboxes with {($checked)} bind properly', function () {
        var data = new can.Map({ completed: true }), frag = can.view.stache('<input type="checkbox" {($checked)}="completed"/>')(data);
        can.append(can.$('#qunit-fixture'), frag);
        var input = can.$('#qunit-fixture')[0].getElementsByTagName('input')[0];
        equal(input.checked, data.attr('completed'), 'checkbox value bound (via attr check)');
        data.attr('completed', false);
        equal(input.checked, data.attr('completed'), 'checkbox value bound (via attr uncheck)');
        input.checked = true;
        can.trigger(input, 'change');
        equal(input.checked, true, 'checkbox value bound (via check)');
        equal(data.attr('completed'), true, 'checkbox value bound (via check)');
        input.checked = false;
        can.trigger(input, 'change');
        equal(input.checked, false, 'checkbox value bound (via uncheck)');
        equal(data.attr('completed'), false, 'checkbox value bound (via uncheck)');
    });
    test('two-way element empty value (1996)', function () {
        var template = can.stache('<input can-value=\'age\'/>');
        var map = new can.Map();
        var frag = template(map);
        var ta = document.getElementById('qunit-fixture');
        ta.appendChild(frag);
        var input = ta.getElementsByTagName('input')[0];
        equal(input.value, '', 'input value set correctly if key does not exist in map');
        map.attr('age', '30');
        equal(input.value, '30', 'input value set correctly');
        map.attr('age', '31');
        equal(input.value, '31', 'input value update correctly');
        input.value = '';
        can.trigger(input, 'change');
        equal(map.attr('age'), '', 'updated from input');
    });
    test('exporting methods (#2051)', function () {
        expect(2);
        can.Component.extend({
            tag: 'foo-bar',
            viewModel: {
                method: function () {
                    ok(true, 'foo called');
                    return 5;
                }
            }
        });
        var template = can.stache('<foo-bar {^@method}=\'@*refKey\'></foo-bar>{{*refKey()}}');
        var frag = template({});
        equal(frag.lastChild.nodeValue, '5');
    });
    test('renders dynamic custom attributes (#1800)', function () {
        var template = can.view.stache('<ul>{{#actions}}<li can-click=\'{{.}}\'>{{.}}</li>{{/actions}}</ul>');
        var map = new can.Map({
            actions: [
                'action1',
                'action2'
            ],
            action1: function () {
                equal(calling, 0, 'action1');
            },
            action2: function () {
                equal(calling, 1, 'action2');
            }
        });
        var frag = template(map), lis = frag.firstChild.getElementsByTagName('li');
        var calling = 0;
        can.trigger(lis[0], 'click');
        calling = 1;
        can.trigger(lis[1], 'click');
    });
    test('One way binding from a select\'s value to a parent compute updates the parent with the select\'s initial value (#2027)', function () {
        var template = can.stache('<select {^$value}=\'value\'><option value=\'One\'>One</option></select>');
        var map = new can.Map();
        var frag = template(map);
        var select = frag.childNodes.item(0);
        setTimeout(function () {
            equal(select.selectedIndex, 0, 'selectedIndex is 0 because no value exists on the map');
            equal(map.attr('value'), 'One', 'The map\'s value property is set to the select\'s value');
            start();
        }, 1);
        stop();
    });
    test('two way binding from a select\'s value to null has no selection (#2027)', function () {
        var template = can.stache('<select {($value)}=\'key\'><option value=\'One\'>One</option></select>');
        var map = new can.Map({ key: null });
        var frag = template(map);
        var select = frag.childNodes.item(0);
        setTimeout(function () {
            equal(select.selectedIndex, -1, 'selectedIndex is 0 because no value exists on the map');
            equal(map.attr('key'), null, 'The map\'s value property is set to the select\'s value');
            start();
        }, 1);
        stop();
    });
    test('two-way bound values that do not match a select option set selectedIndex to -1 (#2027)', function () {
        var renderer = can.view.stache('<select {($value)}="key"><option value="foo">foo</option><option value="bar">bar</option></select>');
        var map = new can.Map({});
        var frag = renderer(map);
        equal(frag.firstChild.selectedIndex, 0, 'undefined <- {($first value)}: selectedIndex = 0');
        map.attr('key', 'notfoo');
        equal(frag.firstChild.selectedIndex, -1, 'notfoo: selectedIndex = -1');
        map.attr('key', 'foo');
        strictEqual(frag.firstChild.selectedIndex, 0, 'foo: selectedIndex = 0');
        map.attr('key', 'notbar');
        equal(frag.firstChild.selectedIndex, -1, 'notbar: selectedIndex = -1');
        map.attr('key', 'bar');
        strictEqual(frag.firstChild.selectedIndex, 1, 'bar: selectedIndex = 1');
        map.attr('key', 'bar');
        strictEqual(frag.firstChild.selectedIndex, 1, 'bar (no change): selectedIndex = 1');
    });
    test('two way bound select empty string null or undefined value (#2027)', function () {
        var template = can.stache('<select id=\'null-select\' {($value)}=\'color-1\'>' + '<option value=\'\'>Choose</option>' + '<option value=\'red\'>Red</option>' + '<option value=\'green\'>Green</option>' + '</select>' + '<select id=\'undefined-select\' {($value)}=\'color-2\'>' + '<option value=\'\'>Choose</option>' + '<option value=\'red\'>Red</option>' + '<option value=\'green\'>Green</option>' + '</select>' + '<select id=\'string-select\' {($value)}=\'color-3\'>' + '<option value=\'\'>Choose</option>' + '<option value=\'red\'>Red</option>' + '<option value=\'green\'>Green</option>' + '</select>');
        var map = new can.Map({
            'color-1': null,
            'color-2': undefined,
            'color-3': ''
        });
        stop();
        var frag = template(map);
        var ta = document.getElementById('qunit-fixture');
        ta.appendChild(frag);
        var nullInput = document.getElementById('null-select');
        var nullInputOptions = nullInput.getElementsByTagName('option');
        var undefinedInput = document.getElementById('undefined-select');
        var undefinedInputOptions = undefinedInput.getElementsByTagName('option');
        var stringInput = document.getElementById('string-select');
        var stringInputOptions = stringInput.getElementsByTagName('option');
        setTimeout(function () {
            ok(!nullInputOptions[0].selected, 'default (null) value set');
            ok(undefinedInputOptions[0].selected, 'default (undefined) value set');
            ok(stringInputOptions[0].selected, 'default (\'\') value set');
            start();
        }, 1);
    });
    test('dynamic attribute bindings (#2016)', function () {
        var template = can.stache('<input {($value)}=\'{{propName}}\'/>');
        var map = new can.Map({
            propName: 'first',
            first: 'Justin',
            last: 'Meyer'
        });
        var frag = template(map);
        var ta = document.getElementById('qunit-fixture');
        ta.appendChild(frag);
        var input = ta.getElementsByTagName('input')[0];
        equal(input.value, 'Justin', 'input value set correctly if key does not exist in map');
        stop();
        map.attr('propName', 'last');
        setTimeout(function () {
            equal(input.value, 'Meyer', 'input value set correctly if key does not exist in map');
            input.value = 'Lueke';
            can.trigger(input, 'change');
            equal(map.attr('last'), 'Lueke', 'updated from input');
            start();
        }, 10);
    });
    test('select bindings respond to changes immediately or during insert (#2134)', function () {
        var countries = [
            {
                code: 'MX',
                countryName: 'MEXICO'
            },
            {
                code: 'US',
                countryName: 'USA'
            },
            {
                code: 'IND',
                countryName: 'INDIA'
            },
            {
                code: 'RUS',
                countryName: 'RUSSIA'
            }
        ];
        var template = can.stache('<select {($value)}="countryCode">' + '{{#each countries}}' + '<option value="{{code}}">{{countryName}}</option>' + '{{/each}}' + '</select>');
        var data = new can.Map({
            countryCode: 'US',
            countries: countries
        });
        var frag = template(data);
        data.attr('countryCode', 'IND');
        stop();
        setTimeout(function () {
            start();
            equal(frag.firstChild.value, 'IND', 'got last updated value');
        }, 10);
    });
    test('select bindings respond to changes immediately or during insert using can-value (#2134)', function () {
        var countries = [
            {
                code: 'MX',
                countryName: 'MEXICO'
            },
            {
                code: 'US',
                countryName: 'USA'
            },
            {
                code: 'IND',
                countryName: 'INDIA'
            },
            {
                code: 'RUS',
                countryName: 'RUSSIA'
            }
        ];
        var template = can.stache('<select can-value="{countryCode}">' + '{{#each countries}}' + '<option value="{{code}}">{{countryName}}</option>' + '{{/each}}' + '</select>');
        var data = new can.Map({
            countryCode: 'US',
            countries: countries
        });
        var frag = template(data);
        data.attr('countryCode', 'IND');
        stop();
        setTimeout(function () {
            start();
            equal(frag.firstChild.value, 'IND', 'got last updated value');
        }, 10);
    });
    test('two-way <select> bindings update to `undefined` if options are replaced (#1762)', function () {
        var countries = [
            {
                code: 'MX',
                countryName: 'MEXICO'
            },
            {
                code: 'US',
                countryName: 'USA'
            }
        ];
        var data = new can.Map({
            countryCode: 'US',
            countries: countries
        });
        var template = can.stache('<select {($value)}="countryCode">' + '{{#countries}}' + '<option value="{{code}}">{{countryName}}</option>' + '{{/countries}}' + '</select>');
        template(data);
        stop();
        setTimeout(function () {
            data.attr('countries').replace([]);
            setTimeout(function () {
                equal(data.attr('countryCode'), undefined, 'countryCode set to undefined');
                start();
            }, 10);
        }, 10);
    });
    test('two-way <select> bindings update to `undefined` if options are replaced - each (#1762)', function () {
        var countries = [
            {
                code: 'MX',
                countryName: 'MEXICO'
            },
            {
                code: 'US',
                countryName: 'USA'
            }
        ];
        var data = new can.Map({
            countryCode: 'US',
            countries: countries
        });
        var template = can.stache('<select {($value)}="countryCode">' + '{{#each countries}}' + '<option value="{{code}}">{{countryName}}</option>' + '{{/each}}' + '</select>');
        template(data);
        stop();
        setTimeout(function () {
            data.attr('countries').replace([]);
            setTimeout(function () {
                equal(data.attr('countryCode'), undefined, 'countryCode set to undefined');
                start();
            }, 10);
        }, 10);
    });
    test('previously non-existing select value gets selected from a list when it is added (#1762)', function () {
        var template = can.view.stache('<select {($value)}="{person}">' + '<option></option>' + '{{#each people}}<option value="{{.}}">{{.}}</option>{{/each}}' + '</select>' + '<input type="text" size="5" {($value)}="person">');
        var people = new can.List([
            'Alexis',
            'Mihael',
            'Curtis',
            'David'
        ]);
        var vm = new can.Map({
            person: 'Brian',
            people: people
        });
        stop();
        vm.bind('person', function (ev, newVal, oldVal) {
            ok(false, 'person attribute should not change');
        });
        var frag = template(vm);
        equal(vm.attr('person'), 'Brian', 'Person is still set');
        setTimeout(function () {
            people.push('Brian');
            setTimeout(function () {
                var select = frag.firstChild;
                ok(select.lastChild.selected, 'New child should be selected');
                start();
            }, 20);
        }, 20);
    });
    test('one-way <select> bindings keep value if options are replaced (#1762)', function () {
        var countries = [
            {
                code: 'MX',
                countryName: 'MEXICO'
            },
            {
                code: 'US',
                countryName: 'USA'
            }
        ];
        var data = new can.Map({
            countryCode: 'US',
            countries: countries
        });
        var template = can.stache('<select {$value}="countryCode">' + '{{#countries}}' + '<option value="{{code}}">{{countryName}}</option>' + '{{/countries}}' + '</select>');
        var frag = template(data);
        var select = frag.firstChild;
        stop();
        setTimeout(function () {
            data.attr('countries').replace([]);
            setTimeout(function () {
                data.attr('countries').replace(countries);
                equal(data.attr('countryCode'), 'US', 'country kept as USA');
                setTimeout(function () {
                    ok(select.getElementsByTagName('option')[1].selected, 'USA still selected');
                }, 10);
                start();
            }, 10);
        }, 10);
    });
    test('one-way <select> bindings keep value if options are replaced - each (#1762)', function () {
        var countries = [
            {
                code: 'MX',
                countryName: 'MEXICO'
            },
            {
                code: 'US',
                countryName: 'USA'
            }
        ];
        var data = new can.Map({
            countryCode: 'US',
            countries: countries
        });
        var template = can.stache('<select {$value}="countryCode">' + '{{#each countries}}' + '<option value="{{code}}">{{countryName}}</option>' + '{{/each}}' + '</select>');
        var frag = template(data);
        var select = frag.firstChild;
        stop();
        setTimeout(function () {
            data.attr('countries').replace([]);
            setTimeout(function () {
                data.attr('countries').replace(countries);
                equal(data.attr('countryCode'), 'US', 'country kept as USA');
                setTimeout(function () {
                    ok(select.getElementsByTagName('option')[1].selected, 'USA still selected');
                }, 10);
                start();
            }, 10);
        }, 10);
    });
    test('@function reference to child (#2116)', function () {
        expect(2);
        var template = can.stache('<foo-bar {@child}="@parent"></foo-bar>');
        can.Component.extend({
            tag: 'foo-bar',
            viewModel: {
                method: function () {
                    ok(false, 'should not be called');
                }
            }
        });
        var VM = can.Map.extend({
            parent: function () {
                ok(false, 'should not be called');
            }
        });
        var vm = new VM({});
        var frag = template(vm);
        equal(typeof can.viewModel(frag.firstChild).attr('child'), 'function', 'to child binding');
        template = can.stache('<foo-bar {^@method}="@vmMethod"></foo-bar>');
        vm = new VM({});
        template(vm);
        ok(typeof vm.attr('vmMethod') === 'function', 'parent export function');
    });
    test('setter only gets called once (#2117)', function () {
        expect(1);
        var VM = can.Map.extend({
            _set: function (prop, val) {
                if (prop === 'bar') {
                    equal(val, 'BAR');
                }
                return can.Map.prototype._set.apply(this, arguments);
            }
        });
        can.Component.extend({
            tag: 'foo-bar',
            viewModel: VM
        });
        var template = can.stache('<foo-bar {bar}="bar"/>');
        template(new can.Map({ bar: 'BAR' }));
    });
    test('function reference to child binding (#2116)', function () {
        expect(2);
        var template = can.stache('<foo-bar {child}="@parent"></foo-bar>');
        can.Component.extend({
            tag: 'foo-bar',
            viewModel: {}
        });
        var VM = can.Map.extend({});
        var vm = new VM({});
        var frag = template(vm);
        vm.attr('parent', function () {
            ok(false, 'should not be called');
        });
        equal(typeof can.viewModel(frag.firstChild).attr('child'), 'function', 'to child binding');
        template = can.stache('<foo-bar {^@method}="vmMethod"></foo-bar>');
        vm = new VM({});
        frag = template(vm);
        can.viewModel(frag.firstChild).attr('method', function () {
            ok(false, 'method should not be called');
        });
        equal(typeof vm.attr('vmMethod'), 'function', 'parent export function');
    });
    test('backtrack path in to-parent bindings (#2132)', function () {
        can.Component.extend({
            tag: 'parent-export',
            viewModel: { value: 'VALUE' }
        });
        var template = can.stache('{{#innerMap}}<parent-export {^value}=\'../parentValue\'/>{{/innerMap}}');
        var data = new can.Map({ innerMap: {} });
        template(data);
        equal(data.attr('parentValue'), 'VALUE', 'set on correct context');
        equal(data.attr('innerMap.parentValue'), undefined, 'nothing on innerMap');
    });
    test('two-way binding with empty strings (#2147)', function () {
        var template = can.stache('<select {($value)}=\'val\'>' + '<option value="">Loading...</option>' + '<option>Empty...</option>' + '</select>');
        var map = new can.Map({
            foo: true,
            val: ''
        });
        var frag = template(map);
        setTimeout(function () {
            equal(frag.firstChild.selectedIndex, 0, 'empty strings are bound');
            start();
        }, 10);
        stop();
    });
    test('double render with batched / unbatched events (#2223)', function () {
        var template = can.stache('{{#page}}{{doLog}}<input {($value)}=\'notAHelper\'/>{{/page}}');
        var appVM = new can.Map();
        var logCalls = 0;
        can.stache.registerHelper('doLog', function () {
            logCalls++;
        });
        template(appVM);
        can.batch.start();
        appVM.attr('page', true);
        can.batch.stop();
        appVM.attr('notAHelper', 'bar');
        equal(logCalls, 1, 'input rendered the right number of times');
    });
    test('Child bindings updated before parent (#2252)', function () {
        var template = can.stache('{{#eq page \'view\'}}<child-binder {page}=\'page\'/>{{/eq}}');
        can.Component.extend({
            tag: 'child-binder',
            template: can.stache('<span/>'),
            viewModel: {
                _set: function (prop, val) {
                    if (prop === 'page') {
                        equal(val, 'view', 'value should not be edit');
                    }
                    return can.Map.prototype._set.apply(this, arguments);
                }
            }
        });
        var vm = new can.Map({ page: 'view' });
        template(vm);
        can.batch.start();
        vm.attr('page', 'edit');
        can.batch.stop();
    });
    test('Child bindings updated before parent (#2252)', function () {
        var template = can.stache('{{#eq page \'view\'}}<child-binder {page}=\'page\'/>{{/eq}}');
        can.Component.extend({
            tag: 'child-binder',
            template: can.stache('<span/>'),
            viewModel: {
                _set: function (prop, val) {
                    if (prop === 'page') {
                        equal(val, 'view', 'value should not be edit');
                    }
                    return can.Map.prototype._set.apply(this, arguments);
                }
            }
        });
        var vm = new can.Map({ page: 'view' });
        template(vm);
        can.batch.start();
        vm.attr('page', 'edit');
        can.batch.stop();
    });
    test('can-value memory leak (#2270)', function () {
        var template = can.view.stache('<div><input can-value="foo"></div>');
        var vm = new can.Map({ foo: '' });
        var frag = template(vm);
        var ta = document.getElementById('qunit-fixture');
        ta.appendChild(frag);
        can.remove(can.$(ta.firstChild));
        stop();
        setTimeout(function () {
            equal(vm._bindings, 0, 'no bindings');
            start();
        }, 10);
    });
});
/*view/live/live_test*/
define('can/view/live/live_test', function (require, exports, module) {
    var can = require('can/util/util');
    require('can/view/live/live');
    require('can/observe/observe');
    require('steal-qunit');
    QUnit.module('can/view/live');
    test('html', function () {
        var div = document.createElement('div'), span = document.createElement('span');
        div.appendChild(span);
        var items = new can.List([
            'one',
            'two'
        ]);
        var html = can.compute(function () {
            var html = '';
            items.each(function (item) {
                html += '<label>' + item + '</label>';
            });
            return html;
        });
        can.view.live.html(span, html, div);
        equal(div.getElementsByTagName('label').length, 2);
        items.push('three');
        equal(div.getElementsByTagName('label').length, 3);
    });
    var esc = function (str) {
        return str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    };
    test('text', function () {
        var div = document.createElement('div'), span = document.createElement('span');
        div.appendChild(span);
        var items = new can.List([
            'one',
            'two'
        ]);
        var text = can.compute(function () {
            var html = '';
            items.each(function (item) {
                html += '<label>' + item + '</label>';
            });
            return html;
        });
        can.view.live.text(span, text, div);
        equal(div.innerHTML, esc('<label>one</label><label>two</label>'));
        items.push('three');
        equal(div.innerHTML, esc('<label>one</label><label>two</label><label>three</label>'));
    });
    test('attributes', function () {
        var div = document.createElement('div');
        var items = new can.List([
            'class',
            'foo'
        ]);
        var text = can.compute(function () {
            var html = '';
            if (items.attr(0) && items.attr(1)) {
                html += items.attr(0) + '=\'' + items.attr(1) + '\'';
            }
            return html;
        });
        can.view.live.attributes(div, text);
        equal(div.className, 'foo');
        items.splice(0, 2);
        equal(div.className, '');
        items.push('foo', 'bar');
        equal(div.getAttribute('foo'), 'bar');
    });
    test('attribute', function () {
        var div = document.createElement('div');
        div.className = 'foo ' + can.view.live.attributePlaceholder + ' ' + can.view.live.attributePlaceholder + ' end';
        var firstObject = new can.Map({});
        var first = can.compute(function () {
            return firstObject.attr('selected') ? 'selected' : '';
        });
        var secondObject = new can.Map({});
        var second = can.compute(function () {
            return secondObject.attr('active') ? 'active' : '';
        });
        can.view.live.attribute(div, 'class', first);
        can.view.live.attribute(div, 'class', second);
        equal(div.className, 'foo   end');
        firstObject.attr('selected', true);
        equal(div.className, 'foo selected  end');
        secondObject.attr('active', true);
        equal(div.className, 'foo selected active end');
        firstObject.attr('selected', false);
        equal(div.className, 'foo  active end');
    });
    test('specialAttribute with new line', function () {
        var div = document.createElement('div');
        var style = can.compute('style="width: 50px;\nheight:50px;"');
        can.view.live.specialAttribute(div, 'style', style);
        equal(div.style.height, '50px');
        equal(div.style.width, '50px');
    });
    test('list', function () {
        var div = document.createElement('div'), list = new can.List([
                'sloth',
                'bear'
            ]), template = function (animal) {
                return '<label>Animal=</label> <span>' + animal + '</span>';
            };
        div.innerHTML = 'my <b>fav</b> animals: <span></span> !';
        var el = div.getElementsByTagName('span')[0];
        can.view.live.list(el, list, template, {});
        equal(div.getElementsByTagName('label').length, 2, 'There are 2 labels');
        div.getElementsByTagName('label')[0].myexpando = 'EXPANDO-ED';
        list.push('turtle');
        equal(div.getElementsByTagName('label')[0].myexpando, 'EXPANDO-ED', 'same expando');
        equal(div.getElementsByTagName('span')[2].innerHTML, 'turtle', 'turtle added');
    });
    test('list with a compute', function () {
        var div = document.createElement('div'), map = new can.Map({
                animals: [
                    'bear',
                    'turtle'
                ]
            }), template = function (animal) {
                return '<label>Animal=</label> <span>' + animal + '</span>';
            };
        var compute = can.compute(function () {
            return map.attr('animals');
        });
        div.innerHTML = 'my <b>fav</b> animals: <span></span> !';
        var el = div.getElementsByTagName('span')[0];
        can.view.live.list(el, compute, template, {});
        equal(div.getElementsByTagName('label').length, 2, 'There are 2 labels');
        div.getElementsByTagName('label')[0].myexpando = 'EXPANDO-ED';
        map.attr('animals').push('turtle');
        equal(div.getElementsByTagName('label')[0].myexpando, 'EXPANDO-ED', 'same expando');
        equal(div.getElementsByTagName('span')[2].innerHTML, 'turtle', 'turtle added');
        map.attr('animals', new can.List([
            'sloth',
            'bear',
            'turtle'
        ]));
        var spans = div.getElementsByTagName('span');
        equal(spans.length, 3, 'there are 3 spans');
        ok(!div.getElementsByTagName('label')[0].myexpando, 'no expando');
    });
    test('list with a compute that returns a list', function () {
        var div = document.createElement('div'), template = function (num) {
                return '<label>num=</label> <span>' + num + '</span>';
            };
        var compute = can.compute([
            0,
            1
        ]);
        div.innerHTML = 'my <b>fav</b> nums: <span></span> !';
        var el = div.getElementsByTagName('span')[0];
        can.view.live.list(el, compute, template, {});
        equal(div.getElementsByTagName('label').length, 2, 'There are 2 labels');
        compute([
            0,
            1,
            2
        ]);
        var spans = div.getElementsByTagName('span');
        equal(spans.length, 3, 'there are 3 spans');
    });
    test('text binding is memory safe (#666)', function () {
        for (var prop in can.view.nodeLists.nodeMap) {
            delete can.view.nodeLists.nodeMap[prop];
        }
        var div = document.createElement('div'), span = document.createElement('span'), el = can.$(div), text = can.compute(function () {
                return 'foo';
            });
        div.appendChild(span);
        can.$('#qunit-fixture')[0].appendChild(div);
        can.view.live.text(span, text, div);
        can.remove(el);
        stop();
        setTimeout(function () {
            ok(can.isEmptyObject(can.view.nodeLists.nodeMap), 'nothing in nodeMap');
            start();
        }, 100);
    });
    test('html live binding handles getting a function from a compute', 5, function () {
        var handler = function (el) {
            ok(true, 'called handler');
            equal(el.nodeType, 3, 'got a placeholder');
        };
        var div = document.createElement('div'), placeholder = document.createTextNode('');
        div.appendChild(placeholder);
        var count = can.compute(0);
        var html = can.compute(function () {
            if (count() === 0) {
                return '<h1>Hello World</h1>';
            } else {
                return handler;
            }
        });
        can.view.live.html(placeholder, html, div);
        equal(div.getElementsByTagName('h1').length, 1, 'got h1');
        count(1);
        equal(div.getElementsByTagName('h1').length, 0, 'got h1');
        count(0);
        equal(div.getElementsByTagName('h1').length, 1, 'got h1');
    });
    test('can.view.live.list does not unbind on a list unnecessarily (#1835)', function () {
        expect(0);
        var div = document.createElement('div'), list = new can.List([
                'sloth',
                'bear'
            ]), template = function (animal) {
                return '<label>Animal=</label> <span>' + animal + '</span>';
            }, unbind = list.unbind;
        list.unbind = function () {
            ok(false, 'unbind called');
            return unbind.apply(this, arguments);
        };
        div.innerHTML = 'my <b>fav</b> animals: <span></span> !';
        var el = div.getElementsByTagName('span')[0];
        can.view.live.list(el, list, template, {});
    });
    test('can.live.attribute works with non-string attributes (#1790)', function () {
        var el = document.createElement('div'), compute = can.compute(function () {
                return 2;
            });
        can.view.elements.setAttr(el, 'value', 1);
        can.view.live.attribute(el, 'value', compute);
        ok(true, 'No exception thrown.');
    });
    test('list and an falsey section (#1979)', function () {
        var div = document.createElement('div'), template = function (num) {
                return '<label>num=</label> <span>' + num + '</span>';
            }, falseyTemplate = function (num) {
                return '<p>NOTHING</p>';
            };
        var compute = can.compute([
            0,
            1
        ]);
        div.innerHTML = 'my <b>fav</b> nums: <span></span> !';
        var el = div.getElementsByTagName('span')[0];
        can.view.live.list(el, compute, template, {}, undefined, undefined, falseyTemplate);
        equal(div.getElementsByTagName('label').length, 2, 'There are 2 labels');
        compute([]);
        var spans = div.getElementsByTagName('span');
        equal(spans.length, 0, 'there are 0 spans');
        var ps = div.getElementsByTagName('p');
        equal(ps.length, 1, 'there is 1 p');
        compute([2]);
        spans = div.getElementsByTagName('span');
        equal(spans.length, 1, 'there is 1 spans');
        ps = div.getElementsByTagName('p');
        equal(ps.length, 0, 'there is 1 p');
    });
    test('list and an initial falsey section (#1979)', function () {
        var div = document.createElement('div'), template = function (num) {
                return '<label>num=</label> <span>' + num + '</span>';
            }, falseyTemplate = function (num) {
                return '<p>NOTHING</p>';
            };
        var compute = can.compute([]);
        div.innerHTML = 'my <b>fav</b> nums: <span></span> !';
        var el = div.getElementsByTagName('span')[0];
        can.view.live.list(el, compute, template, {}, undefined, undefined, falseyTemplate);
        var spans = div.getElementsByTagName('span');
        equal(spans.length, 0, 'there are 0 spans');
        var ps = div.getElementsByTagName('p');
        equal(ps.length, 1, 'there is 1 p');
        compute([2]);
        spans = div.getElementsByTagName('span');
        equal(spans.length, 1, 'there is 1 spans');
        ps = div.getElementsByTagName('p');
        equal(ps.length, 0, 'there is 1 p');
    });
    test('rendered list items should re-render when updated (#2007)', function () {
        var partial = document.createElement('div');
        var placeholderElement = document.createElement('span');
        var list = new can.List(['foo']);
        var renderer = function (item) {
            return '<span>' + item + '</span>';
        };
        partial.appendChild(placeholderElement);
        can.view.live.list(placeholderElement, list, renderer, {});
        equal(partial.getElementsByTagName('span')[0].firstChild.data, 'foo', 'list item 0 is foo');
        list.push('bar');
        equal(partial.getElementsByTagName('span')[1].firstChild.data, 'bar', 'list item 1 is bar');
        list.attr(0, 'baz');
        equal(partial.getElementsByTagName('span')[0].firstChild.data, 'baz', 'list item 0 is baz');
    });
});
/*view/scope/scope_test*/
define('can/view/scope/scope_test', function (require, exports, module) {
    var can = require('can/util/util');
    require('can/view/scope/scope');
    require('can/route/route');
    require('steal-qunit');
    QUnit.module('can/view/scope');
    test('basics', function () {
        var items = new can.Map({
            people: [
                { name: 'Justin' },
                [{ name: 'Brian' }]
            ],
            count: 1000
        });
        var itemsScope = new can.view.Scope(items), arrayScope = new can.view.Scope(itemsScope.attr('people'), itemsScope), firstItem = new can.view.Scope(arrayScope.attr('0'), arrayScope);
        var nameInfo = firstItem.read('name');
        deepEqual(nameInfo.reads, [{
                key: 'name',
                at: false
            }]);
        equal(nameInfo.scope, firstItem);
        equal(nameInfo.value, 'Justin');
        equal(nameInfo.rootObserve, items.people[0]);
    });
    test('can.view.Scope.prototype.computeData', function () {
        var map = new can.Map();
        var base = new can.view.Scope(map);
        var age = base.computeData('age').compute;
        equal(age(), undefined, 'age is not set');
        age.bind('change', function (ev, newVal, oldVal) {
            equal(newVal, 31, 'newVal is provided correctly');
            equal(oldVal, undefined, 'oldVal is undefined');
        });
        age(31);
        equal(map.attr('age'), 31, 'maps age is set correctly');
    });
    test('backtrack path (#163)', function () {
        var row = new can.Map({ first: 'Justin' }), col = { format: 'str' }, base = new can.view.Scope(row), cur = base.add(col);
        equal(cur.attr('.'), col, 'got col');
        equal(cur.attr('..'), row, 'got row');
        equal(cur.attr('../first'), 'Justin', 'got row');
    });
    test('nested properties with compute', function () {
        var me = new can.Map({ name: { first: 'Justin' } });
        var cur = new can.view.Scope(me);
        var compute = cur.computeData('name.first').compute;
        var changes = 0;
        compute.bind('change', function (ev, newVal, oldVal) {
            if (changes === 0) {
                equal(oldVal, 'Justin');
                equal(newVal, 'Brian');
            } else if (changes === 1) {
                equal(oldVal, 'Brian');
                equal(newVal, undefined);
            } else if (changes === 2) {
                equal(oldVal, undefined);
                equal(newVal, 'Payal');
            } else if (changes === 3) {
                equal(oldVal, 'Payal');
                equal(newVal, 'Curtis');
            }
            changes++;
        });
        equal(compute(), 'Justin', 'read value after bind');
        me.attr('name.first', 'Brian');
        me.removeAttr('name');
        me.attr('name', { first: 'Payal' });
        me.attr('name', new can.Map({ first: 'Curtis' }));
    });
    test('function at the end', function () {
        var compute = new can.view.Scope({
            me: {
                info: function () {
                    return 'Justin';
                }
            }
        }).computeData('me.info').compute;
        equal(compute(), 'Justin');
        var fn = function () {
            return this.name;
        };
        var compute2 = new can.view.Scope({
            me: {
                info: fn,
                name: 'Hank'
            }
        }).computeData('me.info', {
            isArgument: true,
            args: []
        }).compute;
        equal(compute2()(), 'Hank');
    });
    test('binds to the right scope only', function () {
        var baseMap = new can.Map({ me: { name: { first: 'Justin' } } });
        var base = new can.view.Scope(baseMap);
        var topMap = new can.Map({ me: { name: {} } });
        var scope = base.add(topMap);
        var compute = scope.computeData('me.name.first').compute;
        compute.bind('change', function (ev, newVal, oldVal) {
            equal(oldVal, 'Justin');
            equal(newVal, 'Brian');
        });
        equal(compute(), 'Justin');
        topMap.attr('me.name.first', 'Payal');
        baseMap.attr('me.name.first', 'Brian');
    });
    test('Scope read returnObserveMethods=true', function () {
        var MapConstruct = can.Map.extend({
            foo: function (arg) {
                equal(this, data.map, 'correct this');
                equal(arg, true, 'correct arg');
            }
        });
        var data = { map: new MapConstruct() };
        var res = can.view.Scope.read(data, can.compute.read.reads('map.foo'), { isArgument: true });
        res.value(true);
    });
    test('rooted observable is able to update correctly', function () {
        var baseMap = new can.Map({ name: { first: 'Justin' } });
        var scope = new can.view.Scope(baseMap);
        var compute = scope.computeData('name.first').compute;
        equal(compute(), 'Justin');
        baseMap.attr('name', new can.Map({ first: 'Brian' }));
        equal(compute(), 'Brian');
    });
    test('computeData reading an object with a compute', function () {
        var sourceAge = 21;
        var age = can.compute(function (newVal) {
            if (newVal) {
                sourceAge = newVal;
            } else {
                return sourceAge;
            }
        });
        var scope = new can.view.Scope({ person: { age: age } });
        var computeData = scope.computeData('person.age');
        var value = computeData.compute();
        equal(value, 21, 'correct value');
        computeData.compute(31);
        equal(age(), 31, 'age updated');
    });
    test('computeData with initial empty compute (#638)', function () {
        expect(2);
        var compute = can.compute();
        var scope = new can.view.Scope({ compute: compute });
        var computeData = scope.computeData('compute');
        equal(computeData.compute(), undefined);
        computeData.compute.bind('change', function (ev, newVal) {
            equal(newVal, 'compute value');
        });
        compute('compute value');
    });
    test('Can read static properties on constructors (#634)', function () {
        can.Map.extend('can.Foo', { static_prop: 'baz' }, { proto_prop: 'thud' });
        var data = new can.Foo({ own_prop: 'quux' }), scope = new can.view.Scope(data);
        equal(scope.computeData('constructor.static_prop').compute(), 'baz', 'static prop');
    });
    test('Can read static properties on constructors (#634)', function () {
        can.Map.extend('can.Foo', { static_prop: 'baz' }, { proto_prop: 'thud' });
        var data = new can.Foo({ own_prop: 'quux' }), scope = new can.view.Scope(data);
        equal(scope.computeData('constructor.static_prop').compute(), 'baz', 'static prop');
    });
    test('Scope lookup restricted to current scope with ./ (#874)', function () {
        var current;
        var scope = new can.view.Scope(new can.Map({ value: 'A Value' })).add(current = new can.Map({}));
        var compute = scope.computeData('./value').compute;
        equal(compute(), undefined, 'no initial value');
        compute.bind('change', function (ev, newVal) {
            equal(newVal, 'B Value', 'changed');
        });
        compute('B Value');
        equal(current.attr('value'), 'B Value', 'updated');
    });
    test('reading properties on undefined (#1314)', function () {
        var scope = new can.view.Scope(undefined);
        var compute = scope.compute('property');
        equal(compute(), undefined, 'got back undefined');
    });
    test('Scope attributes can be set (#1297, #1304)', function () {
        var comp = can.compute('Test');
        var map = new can.Map({ other: { name: 'Justin' } });
        var scope = new can.view.Scope({
            name: 'Matthew',
            other: {
                person: { name: 'David' },
                comp: comp
            }
        });
        scope.attr('name', 'Wilbur');
        equal(scope.attr('name'), 'Wilbur', 'Value updated');
        scope.attr('other.person.name', 'Dave');
        equal(scope.attr('other.person.name'), 'Dave', 'Value updated');
        scope.attr('other.comp', 'Changed');
        equal(comp(), 'Changed', 'Compute updated');
        scope = new can.view.Scope(map);
        scope.attr('other.name', 'Brian');
        equal(scope.attr('other.name'), 'Brian', 'Value updated');
        equal(map.attr('other.name'), 'Brian', 'Name update in map');
    });
    test('computeData.compute get/sets computes in maps', function () {
        var compute = can.compute(4);
        var map = new can.Map();
        map.attr('computer', compute);
        var scope = new can.view.Scope(map);
        var computeData = scope.computeData('computer', {});
        equal(computeData.compute(), 4, 'got the value');
        computeData.compute(5);
        equal(compute(), 5, 'updated compute value');
        equal(computeData.compute(), 5, 'the compute has the right value');
    });
    test('computesData can find update when initially undefined parent scope becomes defined (#579)', function () {
        expect(2);
        var map = new can.Map();
        var scope = new can.view.Scope(map);
        var top = scope.add(new can.Map());
        var computeData = top.computeData('value', {});
        equal(computeData.compute(), undefined, 'initially undefined');
        computeData.compute.bind('change', function (ev, newVal) {
            equal(newVal, 'first');
        });
        map.attr('value', 'first');
    });
    test('A scope\'s %root is the last context', function () {
        var map = new can.Map();
        var refs = can.view.Scope.refsScope();
        var scope = refs.add(map).add(new can.view.Scope.Refs()).add(new can.Map());
        var root = scope.attr('%root');
        ok(!(root instanceof can.view.Scope.Refs), 'root isn\'t a reference');
        equal(root, map, 'The root is the map passed into the scope');
    });
    test('can set scope attributes with ../ (#2132)', function () {
        var map = new can.Map();
        var scope = new can.view.Scope(map);
        var top = scope.add(new can.Map());
        top.attr('../foo', 'bar');
        equal(map.attr('foo'), 'bar');
    });
    test('can read parent context with ../ (#2244)', function () {
        var map = new can.Map();
        var scope = new can.view.Scope(map);
        var top = scope.add(new can.Map());
        equal(top.attr('../'), map, 'looked up value correctly');
    });
});
/*util/string/deparam/deparam_test*/
define('can/util/string/deparam/deparam_test', function (require, exports, module) {
    var can = require('can/util/can');
    require('can/util/string/deparam/deparam');
    require('steal-qunit');
    QUnit.module('can/util/string/deparam');
    test('Nested deparam', function () {
        var data = can.deparam('a[b]=1&a[c]=2');
        equal(data.a.b, 1);
        equal(data.a.c, 2);
        data = can.deparam('a[]=1&a[]=2');
        equal(data.a[0], 1);
        equal(data.a[1], 2);
        data = can.deparam('a[b][]=1&a[b][]=2');
        equal(data.a.b[0], 1);
        equal(data.a.b[1], 2);
        data = can.deparam('a[0]=1&a[1]=2');
        equal(data.a[0], 1);
        equal(data.a[1], 2);
    });
    test('Remaining ampersand', function () {
        var data = can.deparam('a[b]=1&a[c]=2&');
        deepEqual(data, {
            a: {
                b: '1',
                c: '2'
            }
        });
    });
});
/*util/string/string_test*/
define('can/util/string/string_test', function (require, exports, module) {
    var can = require('can/util/util');
    require('can/util/string/string');
    require('can/util/string/deparam/deparam_test');
    require('steal-qunit');
    QUnit.module('can/util/string');
    test('can.sub', function () {
        equal(can.sub('a{b}', { b: 'c' }), 'ac');
        var foo = { b: 'c' };
        equal(can.sub('a{b}', foo, true), 'ac');
        ok(!foo.b, 'b\'s value was removed');
    });
    test('can.sub with undefined values', function () {
        var subbed = can.sub('test{exists} plus{noexists}', { exists: 'test' });
        deepEqual(subbed, null, 'Rendering with undefined values should return null');
        subbed = can.sub('test{exists} plus{noexists}', { exists: 'test' }, true);
        deepEqual(subbed, null, 'Rendering with undefined values should return null even when remove param is true');
    });
    test('can.sub with null values', function () {
        var subbed = can.sub('test{exists} plus{noexists}', {
            exists: 'test',
            noexists: null
        });
        deepEqual(subbed, null, 'Rendering with null values should return null');
        subbed = can.sub('test{exists} plus{noexists}', {
            exists: 'test',
            noexists: null
        }, true);
        deepEqual(subbed, null, 'Rendering with null values should return null even when remove param is true');
    });
    test('can.sub double', function () {
        equal(can.sub('{b} {d}', [{
                b: 'c',
                d: 'e'
            }]), 'c e');
    });
    test('String.underscore', function () {
        equal(can.underscore('Foo.Bar.ZarDar'), 'foo.bar.zar_dar');
    });
    test('can.sub remove', function () {
        var obj = { a: 'a' };
        equal(can.sub('{a}', obj, false), 'a');
        deepEqual(obj, { a: 'a' });
        equal(can.sub('{a}', obj, true), 'a');
        deepEqual(obj, {});
    });
    test('can.getObject Single root', function () {
        var root, result;
        root = { foo: 'bar' };
        result = can.getObject('foo', root);
        equal(result, 'bar', 'got \'bar\'');
        result = can.getObject('baz', root);
        equal(result, undefined, 'got \'undefined\'');
        root = { foo: 'bar' };
        result = can.getObject('foo', root, false);
        equal(result, 'bar', 'got \'bar\'');
        deepEqual(root, {}, 'root is empty');
        root = { foo: 'bar' };
        result = can.getObject('baz', root, false);
        equal(result, undefined, 'got \'undefined\'');
        deepEqual(root, { foo: 'bar' }, 'root is same');
        root = { foo: 'bar' };
        result = can.getObject('foo', root, true);
        equal(result, 'bar', 'got \'bar\'');
        deepEqual(root, { foo: 'bar' }, 'root is same');
        root = { foo: 'bar' };
        result = can.getObject('baz', root, true);
        deepEqual(result, {}, 'got \'{}\'');
        deepEqual(root, {
            foo: 'bar',
            baz: {}
        }, 'added \'baz: {}\' into root');
    });
    test('can.getObject Multiple root', function () {
        var root1, root2, roots, result;
        root1 = { a: 1 };
        root2 = { b: 2 };
        roots = [
            root1,
            root2
        ];
        result = can.getObject('a', roots);
        equal(result, 1, 'got \'1\'');
        result = can.getObject('b', roots);
        equal(result, 2, 'got \'2\'');
        result = can.getObject('c', roots);
        equal(result, undefined, 'got \'undefined\'');
        root1 = { a: 1 };
        root2 = { b: 2 };
        roots = [
            root1,
            root2
        ];
        result = can.getObject('a', roots, false);
        equal(result, 1, 'got \'1\'');
        deepEqual(root1, {}, 'root is empty');
        deepEqual(root2, { b: 2 }, 'root is same');
        root1 = { a: 1 };
        root2 = { b: 2 };
        roots = [
            root1,
            root2
        ];
        result = can.getObject('b', roots, false);
        equal(result, 2, 'got \'2\'');
        deepEqual(root1, { a: 1 }, 'root is same');
        deepEqual(root2, {}, 'root is empty');
        root1 = { a: 1 };
        root2 = { b: 2 };
        roots = [
            root1,
            root2
        ];
        result = can.getObject('c', roots, false);
        equal(result, undefined, 'got \'undefined\'');
        deepEqual(root1, { a: 1 }, 'root is same');
        deepEqual(root2, { b: 2 }, 'root is same');
        root1 = { a: 1 };
        root2 = { b: 2 };
        roots = [
            root1,
            root2
        ];
        result = can.getObject('a', roots, true);
        equal(result, 1, 'got \'1\'');
        deepEqual(root1, { a: 1 }, 'root is same');
        deepEqual(root2, { b: 2 }, 'root is same');
        root1 = { a: 1 };
        root2 = { b: 2 };
        roots = [
            root1,
            root2
        ];
        result = can.getObject('b', roots, true);
        equal(result, 2, 'got \'2\'');
        deepEqual(root1, { a: 1 }, 'root is same');
        deepEqual(root2, { b: 2 }, 'root is same');
        root1 = { a: 1 };
        root2 = { b: 2 };
        roots = [
            root1,
            root2
        ];
        result = can.getObject('c', roots, true);
        deepEqual(result, {}, 'got \'{}\'');
        deepEqual(root1, {
            a: 1,
            c: {}
        }, 'added \'c: {}\' into first root');
        deepEqual(root2, { b: 2 }, 'root is same');
        root1 = undefined;
        root2 = { b: 2 };
        roots = [
            root1,
            root2
        ];
        result = can.getObject('b', roots);
        equal(result, 2, 'got \'2\'');
        root1 = undefined;
        root2 = { b: 2 };
        roots = [
            root1,
            root2
        ];
        result = can.getObject('b', roots, false);
        equal(result, 2, 'got \'2\'');
        equal(root1, undefined, 'got \'undefined\'');
        deepEqual(root2, {}, 'deleted \'b\' from root');
        root1 = undefined;
        root2 = { b: 2 };
        roots = [
            root1,
            root2
        ];
        result = can.getObject('a', roots, true);
        equal(result, undefined, 'got \'undefined\'');
        equal(root1, undefined, 'root is same');
        deepEqual(root2, { b: 2 }, 'root is same');
    });
    test('can.getObject Deep objects', function () {
        var root, result;
        root = { foo: { bar: 'baz' } };
        result = can.getObject('foo.bar', root);
        equal(result, 'baz', 'got \'baz\'');
        result = can.getObject('foo.world', root);
        equal(result, undefined, 'got \'undefined\'');
        root = { foo: { bar: 'baz' } };
        result = can.getObject('foo.bar', root, false);
        equal(result, 'baz', 'got \'baz\'');
        deepEqual(root, { foo: {} }, 'deep object is empty');
        root = { foo: { bar: 'baz' } };
        result = can.getObject('foo.world', root, false);
        equal(result, undefined, 'got \'undefined\'');
        deepEqual(root, { foo: { bar: 'baz' } }, 'root is same');
        root = { foo: { bar: 'baz' } };
        result = can.getObject('foo.bar', root, true);
        equal(result, 'baz', 'got \'baz\'');
        deepEqual(root, { foo: { bar: 'baz' } }, 'root is same');
        root = { foo: { bar: 'baz' } };
        result = can.getObject('foo.world', root, true);
        deepEqual(result, {}, 'got \'{}\'');
        deepEqual(root, {
            foo: {
                bar: 'baz',
                world: {}
            }
        }, 'added \'world: {}\' into deep object');
    });
    test('can.esc', function () {
        var text = can.esc(0);
        equal(text, '0', '0 value properly rendered');
        text = can.esc(null);
        deepEqual(text, '', 'null value returns empty string');
        text = can.esc();
        deepEqual(text, '', 'undefined returns empty string');
        text = can.esc(NaN);
        deepEqual(text, '', 'NaN returns empty string');
        text = can.esc('<div>&nbsp;</div>');
        equal(text, '&lt;div&gt;&amp;nbsp;&lt;/div&gt;', 'HTML escaped properly');
    });
    test('can.camelize', function () {
        var text = can.camelize(0);
        equal(text, '0', '0 value properly rendered');
        text = can.camelize(null);
        equal(text, '', 'null value returns empty string');
        text = can.camelize();
        equal(text, '', 'undefined returns empty string');
        text = can.camelize(NaN);
        equal(text, '', 'NaN returns empty string');
        text = can.camelize('-moz-index');
        equal(text, 'MozIndex');
        text = can.camelize('foo-bar');
        equal(text, 'fooBar');
    });
    test('can.hyphenate', function () {
        var text = can.hyphenate(0);
        equal(text, '0', '0 value properly rendered');
        text = can.hyphenate(null);
        equal(text, '', 'null value returns empty string');
        text = can.hyphenate();
        equal(text, '', 'undefined returns empty string');
        text = can.hyphenate(NaN);
        equal(text, '', 'NaN returns empty string');
        text = can.hyphenate('ABC');
        equal(text, 'ABC');
        text = can.hyphenate('dataNode');
        equal(text, 'data-node');
    });
});
/*util/inserted/inserted_test*/
define('can/util/inserted/inserted_test', function (require, exports, module) {
    require('can/util/inserted/inserted');
    require('steal-qunit');
    QUnit.module('can/util/inserted');
    if (window.jQuery) {
        test('jquery', function () {
            var el = $('<div>');
            el.bind('inserted', function () {
                ok(true, 'inserted called');
            });
            $('#qunit-fixture').append(el);
        });
    }
    if (window.Zepto) {
        test('zepto', function () {
            expect(1);
            var el = $('<div>');
            el.bind('inserted', function () {
                ok(true, 'inserted called');
            });
            $('#qunit-fixture').html(el);
        });
    }
});
/*util/attr/attr_test*/
define('can/util/attr/attr_test', function (require, exports, module) {
    var can = require('can/util/can');
    require('can/util/attr/attr');
    require('can/view/stache/stache');
    require('steal-qunit');
    QUnit.module('can/util/attr');
    test('attributes event', function () {
        var div = document.createElement('div');
        var attrHandler1 = function (ev) {
            equal(ev.attributeName, 'foo', 'attribute name is correct');
            equal(ev.target, div, 'target');
            equal(ev.oldValue, null, 'oldValue');
            equal(div.getAttribute(ev.attributeName), 'bar');
            can.unbind.call(can.$(div), 'attributes', attrHandler1);
        };
        can.bind.call(can.$(div), 'attributes', attrHandler1);
        can.attr.set(div, 'foo', 'bar');
        stop();
        setTimeout(function () {
            var attrHandler = function (ev) {
                ok(true, 'removed event handler should be called');
                equal(ev.attributeName, 'foo', 'attribute name is correct');
                equal(ev.target, div, 'target');
                equal(ev.oldValue, 'bar', 'oldValue should be \'bar\'');
                equal(div.getAttribute(ev.attributeName), null, 'value of the attribute should be null after the remove.');
                can.unbind.call(can.$(div), 'attributes', attrHandler);
                start();
            };
            can.bind.call(can.$(div), 'attributes', attrHandler);
            can.attr.remove(div, 'foo');
        }, 50);
    });
    test('template attr updating', function () {
        var template = can.stache('<div my-attr=\'{{value}}\'></div>'), compute = can.compute('foo');
        var div = template({ value: compute }).childNodes[0];
        can.bind.call(can.$(div), 'attributes', function (ev) {
            equal(ev.oldValue, 'foo');
            equal(ev.attributeName, 'my-attr');
            start();
        });
        equal(div.getAttribute('my-attr'), 'foo', 'attribute set');
        stop();
        compute('bar');
    });
    test('attr.set CHECKED attribute works', function () {
        var input = document.createElement('input');
        input.type = 'checkbox';
        document.getElementById('qunit-fixture').appendChild(input);
        can.attr.set(input, 'CHECKED');
        equal(input.checked, true);
        input.checked = false;
        can.attr.set(input, 'CHECKED');
        equal(input.checked, true);
        can.remove(can.$('#qunit-fixture>*'));
    });
    test('attr.set READONLY property should be set correctly via template binding #1874', function () {
        var template = can.stache('<input type="text" {{#if flag}}READONLY{{/if}}></input>'), compute = can.compute(false);
        var input = template({ flag: compute }).childNodes[0];
        equal(input.readOnly, false, 'readOnly should be false');
        compute(true);
        equal(input.readOnly, true, 'readOnly should be set to true');
        compute(false);
        equal(input.readOnly, false, 'readOnly should be set back to false');
    });
    test('Map special attributes', function () {
        var div = document.createElement('label');
        document.getElementById('qunit-fixture').appendChild(div);
        can.attr.set(div, 'for', 'my-for');
        equal(div.htmlFor, 'my-for', 'Map for to htmlFor');
        can.attr.set(div, 'innertext', 'my-inner-text');
        equal(div.innerText, 'my-inner-text', 'Map innertext to innerText');
        can.attr.set(div, 'textcontent', 'my-content');
        equal(div.textContent, 'my-content', 'Map textcontent to textContent');
        can.attr.set(div, 'readonly');
        equal(div.readOnly, true, 'Map readonly to readOnly');
        can.remove(can.$('#qunit-fixture>*'));
    });
    test('set class attribute via className or setAttribute for svg (#2015)', function () {
        var div = document.createElement('div');
        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        var obj = {
            toString: function () {
                return 'my-class';
            }
        };
        can.attr.set(div, 'class', 'my-class');
        equal(div.getAttribute('class'), 'my-class', 'class mapped to className');
        can.attr.set(div, 'class', undefined);
        equal(div.getAttribute('class'), '', 'an undefined className is an empty string');
        can.attr.set(div, 'class', obj);
        equal(div.getAttribute('class'), 'my-class', 'you can pass an object to className');
        can.attr.set(svg, 'class', 'my-class');
        equal(svg.getAttribute('class'), 'my-class', 'svg class was set as an attribute');
        can.attr.set(svg, 'class', undefined);
        equal(svg.getAttribute('class'), '', 'an undefined svg class is an empty string');
        can.attr.set(svg, 'class', obj);
        equal(svg.getAttribute('class'), 'my-class', 'you can pass an object to svg class');
    });
    if (window.jQuery || window.Zepto) {
        test('zepto or jQuery - bind and unbind', function () {
            var div = document.createElement('div');
            var attrHandler = function (ev) {
                equal(ev.attributeName, 'foo', 'attribute name is correct');
                equal(ev.target, div, 'target');
                equal(ev.oldValue, null, 'oldValue');
                equal(div.getAttribute(ev.attributeName), 'bar');
                $(div).unbind('attributes', attrHandler).attr('foo', 'abc');
                setTimeout(function () {
                    start();
                }, 20);
            };
            $(div).bind('attributes', attrHandler);
            stop();
            $(div).attr('foo', 'bar');
        });
    }
    if (window.MooTools) {
        test('Mootools - addEvent, removeEvent, and set', function () {
            var div = document.createElement('div');
            var attrHandler = function (ev) {
                equal(ev.attributeName, 'foo', 'attribute name is correct');
                equal(ev.target, div, 'target');
                equal(ev.oldValue, null, 'oldValue');
                equal(div.getAttribute(ev.attributeName), 'bar');
                $(div).removeEvent('attributes', attrHandler);
                $(div).set('foo', 'abc');
                setTimeout(function () {
                    start();
                }, 20);
            };
            $(div).addEvent('attributes', attrHandler);
            stop();
            $(div).set('foo', 'bar');
        });
    }
    if (window.dojo) {
        test('Dojo - on, remove, and setAttr', function () {
            var div = document.createElement('div'), nodeList = new dojo.NodeList(div);
            var handler = nodeList.on('attributes', function (ev) {
                equal(ev.attributeName, 'foo', 'attribute name is correct');
                equal(ev.target, div, 'target');
                equal(ev.oldValue, null, 'oldValue');
                equal(div.getAttribute(ev.attributeName), 'bar');
                handler.remove();
                dojo.setAttr(div, 'foo', 'abc');
                setTimeout(function () {
                    start();
                }, 20);
            });
            stop();
            dojo.setAttr(div, 'foo', 'bar');
        });
    }
});
/*util/array/each_test*/
define('can/util/array/each_test', function (require, exports, module) {
    var can = require('can/util/util');
    require('steal-qunit');
    QUnit.module('can/util/array/each');
    test('iOS 8 64-bit JIT object length bug', function () {
        expect(4);
        var i;
        for (i = 0; i < 1000; i++) {
            can.each([]);
        }
        i = 0;
        can.each({
            1: '1',
            2: '2',
            3: '3'
        }, function (index) {
            equal(++i, index, 'Iterate over object');
        });
        equal(i, 3, 'Last index should be the length of the array');
    });
    test('#1989 - isArrayLike needs to check for object type', function () {
        try {
            can.each(true, function (index) {
            });
            ok(true, 'can.each on true worked');
        } catch (e) {
            ok(false, 'Should not fail');
        }
    });
});
/*util/tests/tests_test*/
define('can/util/tests/tests_test', function (require, exports, module) {
    require('can/util/string/string_test');
    require('can/util/inserted/inserted_test');
    require('can/util/attr/attr_test');
    require('can/util/array/each_test');
});
/*util/object/isplain/isplain_test*/
define('can/util/object/isplain/isplain_test', function (require, exports, module) {
    var can = require('can/util/can');
    require('can/util/object/isplain/isplain');
    require('steal-qunit');
    QUnit.asyncTest('isPlainObject', function () {
        expect(15);
        var iframe;
        ok(can.isPlainObject({}), '{}');
        ok(!can.isPlainObject(''), 'string');
        ok(!can.isPlainObject(0) && !can.isPlainObject(1), 'number');
        ok(!can.isPlainObject(true) && !can.isPlainObject(false), 'boolean');
        ok(!can.isPlainObject(null), 'null');
        ok(!can.isPlainObject(undefined), 'undefined');
        ok(!can.isPlainObject([]), 'array');
        ok(!can.isPlainObject(new Date()), 'new Date');
        var fnplain = function () {
        };
        ok(!can.isPlainObject(fnplain), 'fn');
        var fn = function () {
        };
        ok(!can.isPlainObject(new fn()), 'new fn (no methods)');
        fn.prototype.someMethod = function () {
        };
        ok(!can.isPlainObject(new fn()), 'new fn');
        ok(!can.isPlainObject(document.createElement('div')), 'DOM Element');
        ok(!can.isPlainObject(window), 'window');
        try {
            can.isPlainObject(window.location);
            ok(true, 'Does not throw exceptions on host objects');
        } catch (e) {
            ok(false, 'Does not throw exceptions on host objects -- FAIL');
        }
        try {
            iframe = document.createElement('iframe');
            document.body.appendChild(iframe);
            window.iframeDone = function (otherObject) {
                ok(can.isPlainObject(new otherObject()), 'new otherObject');
                document.body.removeChild(iframe);
                start();
            };
            var doc = iframe.contentDocument || iframe.contentWindow.document;
            doc.open();
            doc.write('<body onload=\'window.parent.iframeDone(Object);\'>');
            doc.close();
        } catch (e) {
            document.body.removeChild(iframe);
            ok(true, 'new otherObject - iframes not supported');
            start();
        }
    });
});
/*util/object/object_test*/
define('can/util/object/object_test', function (require, exports, module) {
    var can = require('can/util/can');
    require('can/util/object/object');
    require('can/util/object/isplain/isplain_test');
    require('steal-qunit');
    QUnit.module('can/util/object');
    test('same', function () {
        ok(can.Object.same({ type: 'FOLDER' }, {
            type: 'FOLDER',
            count: 5
        }, { count: null }), 'count ignored');
        ok(can.Object.same({ type: 'folder' }, { type: 'FOLDER' }, { type: 'i' }), 'folder case ignored');
        ok(!can.Object.same({ foo: null }, { foo: new Date() }), 'nulls and Dates are not considered the same. (#773)');
        ok(!can.Object.same({ foo: null }, { foo: {} }), 'nulls and empty objects are not considered the same. (#773)');
    });
    test('subsets', function () {
        var res1 = can.Object.subsets({
            parentId: 5,
            type: 'files'
        }, [
            { parentId: 6 },
            { type: 'folders' },
            { type: 'files' }
        ]);
        deepEqual(res1, [{ type: 'files' }]);
        var res2 = can.Object.subsets({
            parentId: 5,
            type: 'files'
        }, [
            {},
            { type: 'folders' },
            { type: 'files' }
        ]);
        deepEqual(res2, [
            {},
            { type: 'files' }
        ]);
        var res3 = can.Object.subsets({
            parentId: 5,
            type: 'folders'
        }, [
            { parentId: 5 },
            { type: 'files' }
        ]);
        deepEqual(res3, [{ parentId: 5 }]);
    });
    test('subset compare', function () {
        ok(can.Object.subset({ type: 'FOLDER' }, { type: 'FOLDER' }), 'equal sets');
        ok(can.Object.subset({
            type: 'FOLDER',
            parentId: 5
        }, { type: 'FOLDER' }), 'sub set');
        ok(!can.Object.subset({ type: 'FOLDER' }, {
            type: 'FOLDER',
            parentId: 5
        }), 'wrong way');
        ok(!can.Object.subset({
            type: 'FOLDER',
            parentId: 7
        }, {
            type: 'FOLDER',
            parentId: 5
        }), 'different values');
        ok(can.Object.subset({
            type: 'FOLDER',
            count: 5
        }, { type: 'FOLDER' }, { count: null }), 'count ignored');
        ok(can.Object.subset({
            type: 'FOLDER',
            kind: 'tree'
        }, {
            type: 'FOLDER',
            foo: true,
            bar: true
        }, {
            foo: null,
            bar: null
        }), 'understands a subset');
        ok(can.Object.subset({
            type: 'FOLDER',
            foo: true,
            bar: true
        }, {
            type: 'FOLDER',
            kind: 'tree'
        }, {
            foo: null,
            bar: null,
            kind: null
        }), 'ignores nulls');
    });
    test('searchText', function () {
        var item = {
                id: 1,
                name: 'thinger'
            }, searchText = { searchText: 'foo' }, compare = {
                searchText: function (items, paramsText, itemr, params) {
                    equal(item, itemr);
                    equal(searchText, params);
                    return true;
                }
            };
        ok(can.Object.subset(item, searchText, compare), 'searchText');
    });
});
/*util/function/function_test*/
define('can/util/function/function_test', function (require, exports, module) {
    var can = require('can/util/can');
    require('can/util/function/function');
    require('steal-qunit');
    QUnit.module('can/util/function');
    var ctx1 = { name: 'David' };
    var ctx2 = { name: 'Justin' };
    test('can.debounce uses the correct context (#782)', function () {
        var debouncer = can.debounce(function (callback) {
            callback(this);
        }, 0);
        stop();
        debouncer.call(ctx1, function (ctx) {
            equal(ctx.name, 'David', 'Got correct context');
            debouncer.call(ctx2, function (ctx) {
                equal(ctx.name, 'Justin', 'Got correct context');
                start();
            });
        });
    });
    test('can.throttle uses the correct context', function () {
        var throttler = can.throttle(function (callback) {
            callback(this);
        }, 0);
        stop();
        throttler.call(ctx1, function (ctx) {
            equal(ctx.name, 'David', 'Got correct context');
            setTimeout(function () {
                throttler.call(ctx2, function (ctx) {
                    equal(ctx.name, 'Justin', 'Got correct context');
                    start();
                });
            }, 20);
        });
    });
});
/*view/autorender/autorender_test*/
define('can/view/autorender/autorender_test', function (require, exports, module) {
    require('steal-qunit');
    require('can/test/test');
    var makeIframe = function (src) {
        var iframe = document.createElement('iframe');
        window.removeMyself = function () {
            delete window.removeMyself;
            delete window.isReady;
            delete window.hasError;
            document.body.removeChild(iframe);
            start();
        };
        window.hasError = function (error) {
            ok(false, error.message);
            window.removeMyself();
        };
        document.body.appendChild(iframe);
        iframe.src = src;
    };
    var makeBasicTestIframe = function (src) {
        var iframe = document.createElement('iframe');
        window.removeMyself = function () {
            delete window.removeMyself;
            delete window.isReady;
            delete window.hasError;
            document.body.removeChild(iframe);
            start();
        };
        window.hasError = function (error) {
            ok(false, error.message);
            window.removeMyself();
        };
        window.isReady = function (el, scope) {
            equal(el.length, 1, 'only one my-component');
            equal(el.html(), 'Hello World', 'template rendered');
            equal(el[0].className, 'inserted', 'template rendered');
            equal(scope.attr('message'), 'Hello World', 'Scope correctly setup');
            window.removeMyself();
        };
        document.body.appendChild(iframe);
        iframe.src = src;
    };
    QUnit.module('can/view/autorender');
    if (window.steal) {
        asyncTest('the basics are able to work for steal', function () {
            makeBasicTestIframe(can.test.path('view/autorender/tests/basics.html?' + Math.random()));
        });
        asyncTest('autoload loads a jquery viewmodel fn', function () {
            makeIframe(can.test.path('view/autorender/tests/steal-viewmodel.html?' + Math.random()));
        });
    } else if (window.requirejs) {
        asyncTest('the basics are able to work for requirejs', function () {
            makeBasicTestIframe(can.test.path('../../view/autorender/tests/requirejs-basics.html?' + Math.random()));
        });
    } else {
        asyncTest('the basics are able to work standalone', function () {
            makeBasicTestIframe(can.test.path('view/autorender/tests/standalone-basics.html?' + Math.random()));
        });
    }
});
/*util/vdom/build_fragment/build_fragment_test*/
define('util/vdom/build_fragment/build_fragment_test', [
    'module',
    '@loader'
], function (module, loader) {
    loader.get('@@global-helpers').prepareGlobal(module.id, []);
    var define = loader.global.define;
    var require = loader.global.require;
    var source = '\n';
    loader.global.define = undefined;
    loader.global.module = undefined;
    loader.global.exports = undefined;
    loader.__exec({
        'source': source,
        'address': module.uri
    });
    loader.global.require = require;
    loader.global.define = define;
    return loader.get('@@global-helpers').retrieveGlobal(module.id, undefined);
});
/*util/vdom/document/document_test*/
define('can/util/vdom/document/document_test', function (require, exports, module) {
    var can = require('can/util/can');
    require('can/util/vdom/document/document');
    require('can/util/fragment');
    require('steal-qunit');
    QUnit.module('can/util/vdom/document');
    test('parsing <-\n>', function () {
        var frag = can.buildFragment('<-\n>', can.simpleDocument);
        equal(frag.firstChild.nodeValue, '<-\n>');
    });
});
/*view/import/import_test*/
define('can/view/import/import_test', function (require, exports, module) {
    var can = require('can/util/util');
    var Component = require('can/component/component');
    var stache = require('can/view/stache/stache');
    var getIntermediateAndImports = require('can/view/stache/intermediate_and_imports');
    require('can/view/import/import');
    require('steal-qunit');
    if (window.steal) {
        QUnit.module('can/view/import');
        var test = QUnit.test;
        var equal = QUnit.equal;
        test('static imports are imported', function () {
            var iai = getIntermediateAndImports('<can-import from=\'can/view/import/test/hello\'/>' + '<hello-world></hello-world>');
            equal(iai.imports.length, 1, 'There is one import');
        });
        test('dynamic imports are not imported', function () {
            var iai = getIntermediateAndImports('{{#if a}}<can-import from=\'can/view/import/test/hello\'>' + '<hello-world></hello-world></can-import>{{/if a}}');
            equal(iai.imports.length, 0, 'There are no imports');
        });
        asyncTest('dynamic imports will only load when in scope', function () {
            expect(4);
            var iai = getIntermediateAndImports('{{#if a}}<can-import from=\'can/view/import/test/hello\'>' + '{{#eq state \'resolved\'}}<hello-world></hello-world>{{/eq}}</can-import>{{/if a}}');
            var template = stache(iai.intermediate);
            var a = can.compute(false);
            var res = template({ a: a });
            equal(res.childNodes[0].childNodes.length, 0, 'There are no child nodes immediately');
            a(true);
            can['import']('can/view/import/test/hello').then(function () {
                equal(res.childNodes[0].childNodes.length, 1, 'There is now a nested component');
                equal(res.childNodes[0].childNodes[0].tagName.toUpperCase(), 'HELLO-WORLD', 'imported the tag');
                equal(res.childNodes[0].childNodes[0].childNodes[0].nodeValue, 'Hello world!', 'text inserted');
                start();
            });
        });
        test('if a can-tag is present, handed over rendering to that tag', function () {
            var iai = getIntermediateAndImports('<can-import from=\'can/view/import/test/hello\' can-tag=\'loading\'/>');
            can.view.tag('loading', function (el) {
                var template = stache('it worked');
                can.appendChild(el, template());
            });
            var template = stache(iai.intermediate);
            var res = template();
            equal(res.childNodes[0].childNodes[0].nodeValue, 'it worked', 'Rendered with the can-tag');
        });
        asyncTest('can use an import\'s value', function () {
            var template = '<can-import from=\'can/view/import/test/person\' {^value}=\'*person\' />hello {{*person.name}}';
            var iai = getIntermediateAndImports(template);
            var renderer = stache(iai.intermediate);
            var res = renderer(new can.Map());
            can['import']('can/view/import/test/person').then(function () {
                equal(res.childNodes[2].nodeValue, 'world', 'Got the person.name from the import');
                start();
            });
        });
        asyncTest('can import a template and use it', function () {
            var template = '<can-import from=\'can/view/import/test/other.stache!\' {^@value}=\'*other\' />{{{*other()}}}';
            can.stache.async(template).then(function (renderer) {
                var frag = renderer();
                can['import']('can/view/import/test/other.stache!').then(function () {
                    equal(frag.childNodes[3].firstChild.nodeValue, 'hi there', 'Partial was renderered right after the can-import');
                    QUnit.start();
                });
            });
        });
        asyncTest('can import a template and use it using the > syntax', function () {
            var template = '<can-import from=\'can/view/import/test/other.stache!\' {^@value}=\'*other\' />{{> *other}}';
            can.stache.async(template).then(function (renderer) {
                var frag = renderer();
                can['import']('can/view/import/test/other.stache!').then(function () {
                    equal(frag.childNodes[3].firstChild.nodeValue, 'hi there', 'Partial was renderered right after the can-import');
                    QUnit.start();
                });
            });
        });
        asyncTest('importing a template works with can-tag', function () {
            Component.extend({
                tag: 'my-waiter',
                template: can.stache('{{#isResolved}}' + '<content></content>' + '{{else}}' + '<div class=\'loading\'></div>' + '{{/isResolved}}')
            });
            var template = '<can-import from=\'can/view/import/test/other.stache!\' {^@value}=\'*other\' can-tag=\'my-waiter\'>{{{*other()}}}</can-import>';
            can.stache.async(template).then(function (renderer) {
                var frag = renderer(new can.Map());
                can['import']('can/view/import/test/other.stache!').then(function () {
                    ok(frag.childNodes[0].childNodes.length > 1, 'Something besides a text node is inserted');
                    equal(frag.childNodes[0].childNodes[2].firstChild.nodeValue, 'hi there', 'Partial worked with can-tag');
                    QUnit.start();
                });
            });
        });
        asyncTest('can dynamically import a template and use it', function () {
            var template = '<can-import from=\'can/view/import/test/other-dynamic.stache!\' {^@value}=\'*other\'/>{{> *other}}';
            can.stache.async(template).then(function (renderer) {
                var frag = renderer();
                can['import']('can/view/import/test/other.stache!').then(function () {
                    equal(frag.childNodes[3].firstChild.nodeValue, 'hi there', 'Partial was renderered right after the can-import');
                    QUnit.start();
                });
            });
        });
    }
});
/*[global-shim-end]*/
(function (){
	window._define = window.define;
	window.define = window.define.orig;
})();