'use strict';

describe('routerViewPort', function () {

  var elt,
      ctrl,
      $compile,
      $rootScope,
      $templateCache,
      $controllerProvider;

  beforeEach(function() {
    module('ngFuturisticRouter');
    module(function(_$controllerProvider_) {
      $controllerProvider = _$controllerProvider_;
    });

    inject(function(_$compile_, _$rootScope_, _$templateCache_) {
      $compile = _$compile_;
      $rootScope = _$rootScope_;
      $templateCache = _$templateCache_;
    });

    put('router', '<div router-view-port></div>');
    $controllerProvider.register('RouterController', function (router) {
      ctrl = this;
    });

    put('user', '<div>hello {{name}}</div>');
    $controllerProvider.register('UserController', function($scope, routeParams) {
      $scope.name = routeParams.name || 'blank';
    });

    put('one', '<div>{{number}}</div>');
    $controllerProvider.register('OneController', boringController('number', 'one'));

    put('two', '<div>{{number}}</div>');
    $controllerProvider.register('TwoController', boringController('number', 'two'));
  });


  it('should work in a simple case', inject(function (router) {
    compile('<router-component component-name="router"></router-component>');

    router.config([
      { path: '/', component: 'user' }
    ]);

    router.navigate('/');
    $rootScope.$digest();

    expect(elt.text()).toBe('hello blank');
  }));


  it('should navigate between components with different parameters', inject(function (router) {
    router.config([
      { path: '/user/:name', component: 'user' }
    ]);
    compile('<router-component component-name="router"></router-component>');

    router.navigate('/user/brian');
    $rootScope.$digest();
    expect(elt.text()).toBe('hello brian');

    router.navigate('/user/igor');
    $rootScope.$digest();
    expect(elt.text()).toBe('hello igor');
  }));


  it('should work with multiple named viewports', inject(function (router) {
    put('router', 'port 1: <div router-view-port="one"></div> | ' +
                       'port 2: <div router-view-port="two"></div>');

    router.config([
      { path: '/', component: {one: 'one', two: 'two'} }
    ]);
    compile('<router-component component-name="router"></router-component>');

    router.navigate('/');
    $rootScope.$digest();

    expect(elt.text()).toBe('port 1: one | port 2: two');
  }));


  it('should work with nested viewports', inject(function (router) {

    put('childRouter', '<div>inner { <div router-view-port></div> }</div>');
    $controllerProvider.register('ChildRouterController', function (router) {
      router.config([
        { path: '/b', component: 'one' }
      ]);
    });

    put('router', '<div>outer { <div router-view-port></div> }</div>');
    router.config([
      { path: '/a', component: 'childRouter' }
    ]);

    compile('<router-component component-name="router"></router-component>');

    router.navigate('/a/b');
    $rootScope.$digest(true);

    expect(elt.text()).toBe('outer { inner { one } }');
  }));


  it('should update anchor hrefs with the routerLink directive', inject(function (router) {
    put('router', '<div>outer { <div router-view-port></div> }</div>');
    put('one', '<div><a router-link="two">{{number}}</a></div>');

    router.config([
      { path: '/a', component: 'one' },
      { path: '/b', component: 'two' }
    ]);
    compile('<router-component component-name="router"></router-component>');

    router.navigate('/a');
    $rootScope.$digest();

    expect(elt.find('a').attr('href')).toBe('./b');
  }));


  it('should update anchors hrefs in nested viewports', inject(function (router) {

    put('childRouter', '<div><a router-link="two">inner</a> { <div router-view-port></div> }</div>');
    $controllerProvider.register('ChildRouterController', function (router) {
      router.config([
        { path: '/b', component: 'one' },
        { path: '/c', component: 'two' }
      ]);
    });

    put('router', '<div><a router-link="user">outer</a> { <div router-view-port></div> }</div>');
    router.config([
      { path: '/a', component: 'childRouter' },
      { path: '/d', component: 'user' }
    ]);

    compile('<router-component component-name="router"></router-component>');

    router.navigate('/a/b');
    $rootScope.$digest(true);

    expect(elt.find('a')[0].getAttribute('href')).toBe('../d');
    expect(elt.find('a')[1].getAttribute('href')).toBe('./c');
  }));


  it('should allow params in routerLink directive', inject(function (router) {
    put('router', '<div>outer { <div router-view-port></div> }</div>');
    put('one', '<div><a router-link="two({param: \'lol\'})">{{number}}</a></div>');

    router.config([
      { path: '/a', component: 'one' },
      { path: '/b/:param', component: 'two' }
    ]);
    compile('<router-component component-name="router"></router-component>');

    router.navigate('/a');
    $rootScope.$digest();

    expect(elt.find('a').attr('href')).toBe('./b/lol');
  }));

  // TODO: test dynamic links


  it('should update the href of links', inject(function (router) {
    put('router', '<div>outer { <div router-view-port></div> }</div>');
    put('one', '<div><a router-link="two({param: number})">{{number}}</a></div>');

    router.config([
      { path: '/a', component: 'one' },
      { path: '/b/:param', component: 'two' }
    ]);
    compile('<router-component component-name="router"></router-component>');

    router.navigate('/a');
    $rootScope.$digest();

    expect(elt.find('a').attr('href')).toBe('./b/one');
  }));


  it('should run the activate hook of controllers', inject(function (router) {
    put('router', '<div>outer { <div router-view-port></div> }</div>');
    put('activate', 'hi');

    $controllerProvider.register('ActivateController', ActivateController);
    function ActivateController() {}
    var spy = ActivateController.prototype.activate = jasmine.createSpy('activate');

    router.config([
      { path: '/a', component: 'activate' }
    ]);
    compile('<router-component component-name="router"></router-component>');

    router.navigate('/a');
    $rootScope.$digest();

    expect(spy).toHaveBeenCalled();
  }));


  it('should not activate a component when canActivate returns false', inject(function (router) {
    put('router', '<div>outer { <div router-view-port></div> }</div>');
    put('activate', 'hi');

    $controllerProvider.register('ActivateController', ActivateController);
    function ActivateController() {}
    ActivateController.prototype.canActivate = function () {
      return false;
    };
    var spy = ActivateController.prototype.activate = jasmine.createSpy('activate');

    router.config([
      { path: '/a', component: 'activate' }
    ]);
    compile('<router-component component-name="router"></router-component>');

    router.navigate('/a');
    $rootScope.$digest();

    expect(spy).not.toHaveBeenCalled();
    expect(elt.text()).toBe('outer {  }');
  }));


  it('should not activate a component when canDeactivate returns false', inject(function (router) {
    put('router', '<div>outer { <div router-view-port></div> }</div>');
    put('activate', 'hi');

    $controllerProvider.register('ActivateController', ActivateController);
    function ActivateController() {}
    ActivateController.prototype.canDeactivate = function () {
      return false;
    };
    var spy = ActivateController.prototype.activate = jasmine.createSpy('activate');

    router.config([
      { path: '/a', component: 'activate' },
      { path: '/b', component: 'one' }
    ]);
    compile('<router-component component-name="router"></router-component>');

    router.navigate('/a');
    $rootScope.$digest();
    expect(elt.text()).toBe('outer { hi }');

    router.navigate('/b');
    $rootScope.$digest();
    expect(elt.text()).toBe('outer { hi }');
  }));


  it('should activate a component when canActivate returns true', inject(function (router) {
    put('router', '<div>outer { <div router-view-port></div> }</div>');
    put('activate', 'hi');

    $controllerProvider.register('ActivateController', ActivateController);
    function ActivateController() {}
    ActivateController.prototype.canActivate = function () {
      return true;
    };
    var spy = ActivateController.prototype.activate = jasmine.createSpy('activate');

    router.config([
      { path: '/a', component: 'activate' }
    ]);
    compile('<router-component component-name="router"></router-component>');

    router.navigate('/a');
    $rootScope.$digest();

    expect(spy).toHaveBeenCalled();
    expect(elt.text()).toBe('outer { hi }');
  }));


  it('should change location path', inject(function (router, $location) {
    compile('<router-component component-name="router"></router-component>');

    router.config([
      { path: '/user', component: 'user' }
    ]);

    router.navigate('/user');
    $rootScope.$digest();

    expect($location.path()).toBe('/user');
  }));

  // TODO: location path base href
  /*
  it('should change the location according to...', fuction () {
    expect('').toBe('');
  });
  */

  it('should change location to the cannonical route', inject(function (router, $location) {
    compile('<router-component component-name="router"></router-component>');

    router.config([
      { path: '/',     redirectTo: '/user' },
      { path: '/user', component:  'user' }
    ]);

    router.navigate('/');
    $rootScope.$digest();

    expect($location.path()).toBe('/user');
  }));


  it('should change location to the cannonical route with nested components', inject(function (router, $location) {
    compile('<router-component component-name="router"></router-component>');

    router.config([
      { path: '/old-parent', redirectTo: '/new-parent' },
      { path: '/new-parent', component:  'childRouter' }
    ]);

    put('childRouter', '<div>inner { <div router-view-port></div> }</div>');
    $controllerProvider.register('ChildRouterController', function (router) {
      router.config([
        { path: '/old-child', redirectTo: '/new-child' },
        { path: '/new-child', component: 'one'},
        { path: '/old-child-two', redirectTo: '/new-child-two' },
        { path: '/new-child-two', component: 'two'}
      ]);
    });

    router.navigate('/old-parent/old-child');
    $rootScope.$digest();

    expect($location.path()).toBe('/new-parent/new-child');
    expect(elt.text()).toBe('inner { one }');

    router.navigate('/old-parent/old-child-two');
    $rootScope.$digest();

    expect($location.path()).toBe('/new-parent/new-child-two');
    expect(elt.text()).toBe('inner { two }');
  }));


  it('should navigate when the location path changes', inject(function (router, $location) {
    compile('<router-component component-name="router"></router-component>');

    router.config([
      { path: '/user', component: 'user' }
    ]);

    $location.path('/user');
    $rootScope.$digest();

    expect(elt.text()).toBe('hello blank');
  }));


  function boringController (model, value) {
    return function ($scope) {
      $scope[model] = value;
    };
  }

  function put (name, template) {
    $templateCache.put(componentTemplatePath(name), [200, template, {}]);
  }

  function compile(template) {
    elt = $compile('<div>' + template + '</div>')($rootScope);
    $rootScope.$digest();
    return elt;
  }
});


describe('routerViewPort animations', function () {

  var elt,
      ctrl,
      $animate,
      $compile,
      $rootScope,
      $templateCache,
      $controllerProvider;

  beforeEach(function() {
    module('ngAnimate');
    module('ngAnimateMock');
    module('ngFuturisticRouter');
    module(function(_$controllerProvider_) {
      $controllerProvider = _$controllerProvider_;
    });

    inject(function(_$animate_, _$compile_, _$rootScope_, _$templateCache_) {
      $animate = _$animate_;
      $compile = _$compile_;
      $rootScope = _$rootScope_;
      $templateCache = _$templateCache_;
    });

    put('router', '<div router-view-port></div>');
    $controllerProvider.register('RouterController', function (router) {
      ctrl = this;
    });

    put('user', '<div>hello {{name}}</div>');
    $controllerProvider.register('UserController', function($scope, routeParams) {
      $scope.name = routeParams.name || 'blank';
    });
  });

  afterEach(function() {
    expect($animate.queue).toEqual([]);
  });

  it('should work in a simple case', inject(function (router) {
    var item;

    compile('<router-component component-name="router"></router-component>');

    router.config([
      { path: '/user/:name', component: 'user' }
    ]);

    router.navigate('/user/brian');
    $rootScope.$digest();
    expect(elt.text()).toBe('hello brian');

    // "router" component enters
    item = $animate.queue.shift();
    expect(item.event).toBe('enter');

    // "user" component enters
    item = $animate.queue.shift();
    expect(item.event).toBe('enter');

    router.navigate('/user/pete');
    $rootScope.$digest();
    expect(elt.text()).toBe('hello pete');


    // "user brian" component leaves
    item = $animate.queue.shift();
    expect(item.event).toBe('leave');
    expect(item.element.text()).toBe('hello brian');

    // "user pete" component enters
    item = $animate.queue.shift();
    expect(item.event).toBe('enter');
    expect(item.event).toBe('enter');
  }));

  function put (name, template) {
    $templateCache.put(componentTemplatePath(name), [200, template, {}]);
  }

  function compile(template) {
    elt = $compile('<div>' + template + '</div>')($rootScope);
    $rootScope.$digest();
    return elt;
  }
});

function componentTemplatePath(name) {
  return './components/' + dashCase(name) + '/' + dashCase(name) + '.html';
}

function dashCase(str) {
  return str.replace(/([A-Z])/g, function ($1) {
    return '-' + $1.toLowerCase();
  });
}
