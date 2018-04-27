var nsGmx = window.nsGmx = window.nsGmx || {};

nsGmx.Auth = nsGmx.Auth || {};

(function() {
    //TODO: использовать ли библиотеку?
    function parseUri(str)
    {
        var parser = /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/,
            key = ["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"],
            m = parser.exec(str),
            uri = {},
            i   = 14;

        while (i--) uri[key[i]] = m[i] || "";
        
        // HACK
        uri.hostOnly = uri.host;
        uri.host = uri.authority;
        
        return uri;
    };
    
    var requests = {},
        lastRequestId = 0,
        uniquePrefix = 'id' + Math.random();

    var processMessage = function(e) {
        if (!(e.origin in requests)) {
            return;
        }
        
        var dataStr = decodeURIComponent(e.data.replace(/\n/g,'\n\\'));
        try {
            var dataObj = JSON.parse(dataStr);
        } catch (e) {
            return;
        }
        
        var request = requests[e.origin][dataObj.CallbackName];
        if (!request) return;    // какой-то левый message
        
        delete requests[e.origin][dataObj.CallbackName];
        
        request.iframe.parentNode.removeChild(request.iframe);
        request.callback && request.callback(dataObj);
    }
    
    //совместимость с IE8
    if (window.addEventListener) {
        window.addEventListener('message', processMessage);
    } else {
        window.attachEvent('onmessage', processMessage);
    }
    
    var addQueryVariables = function(url, variables) {
        var oldQueryString = url.split('?')[1];
        var newQueryString = '';
        for (var variable in variables) {
            if (variables.hasOwnProperty(variable)) {
                newQueryString += ('&' + variable + '=' + encodeURIComponent(variables[variable]));
            }
        }
        if (oldQueryString) {
            return url + newQueryString;
        } else {
            return url + '?' + newQueryString.slice(1);
        }
    };
    
    function createPostIframe(id)
    {
        var iframe = document.createElement("iframe");
        iframe.style.display = 'none';
        iframe.setAttribute('id', id);
        iframe.setAttribute('name', id);
        iframe.src = 'javascript:true';
        
        return iframe;
    }

    nsGmx.Auth.Server = (function() {
        /**
         * @class
         * @constructor
         */
        var Server = function(options) {
            this._root = options.root;
        };

        /** Послать GET запрос к серверу ресурсов.
         * @param  {String} url
         * @param  {Object} params
         * @return {Function} promise(data)
         */
        Server.prototype.sendGetRequest = function(url, params) {
            var deferred = $.Deferred();
            var requestUrl = this._root + '/' + url;
            requestUrl = addQueryVariables(requestUrl, params);
            $.ajax({
                url: requestUrl,
                dataType: 'jsonp',
                jsonp: 'CallbackName'
            }).done(function(data) {
                deferred.resolve(data);
            }).fail(function(errors) {
                deferred.reject({
                    Status: 'error'
                });
            });
            return deferred.promise();
        };
        
        /** Послать к серверу ресурсов запрос за картинкой.
         * @param  {String} url
         * @param  {Object} params
         * @return {Function} promise(image)
         */
        Server.prototype.sendImageRequest = function(url, params) {
            var deferred = $.Deferred();
            var requestUrl = this._root + '/' + url;
            requestUrl = addQueryVariables(requestUrl, params);
            
            var img = new Image();
            
            img.onload = function() {
                deferred.resolve({
                    Status: 'ok',
                    Result: img
                });
            }
            img.onerror = deferred.reject.bind(deferred);
            
            img.src = requestUrl;
            
            return deferred.promise();
        };

        /** Послать POST запрос к серверу ресурсов.
         * @param  {String} url
         * @param  {Object} params
         * @param  {HTMLFormElement} baseForm HTML Form, которая может быть использована как основа для посылки запроса (например, если нужно загрузить файл)
         * @return {Function} promise(data)
         */
        Server.prototype.sendPostRequest = function(url, params, baseForm) {
            var requestURL = this._root + '/' + url,
                deferred = $.Deferred(),
                processResponse = function(response) {
                    if (response.Status !== 'ok') {
                        deferred.reject(response);
                    } else {
                        deferred.resolve(response);
                    }
                },
                id = uniquePrefix + (lastRequestId++),
                iframe = createPostIframe(id),
                parsedURL = parseUri(requestURL),
                origin = (parsedURL.protocol ? (parsedURL.protocol + ':') : window.location.protocol) + '//' + (parsedURL.host || window.location.host),
                originalFormAction,
                form;
            
            requests[origin] = requests[origin] || {};
            requests[origin][id] = {callback: processResponse, iframe: iframe};
                
            if (baseForm)
            {
                form = baseForm;
                originalFormAction = form.getAttribute('action');
                form.setAttribute('action', requestURL);
                form.target = id;
                
            }
            else
            {
                form = document.createElement('form');
                form.style.display = 'none';
                form.setAttribute('enctype', 'multipart/form-data');
                form.target = id;
                form.setAttribute('method', 'POST');
                form.setAttribute('action', requestURL);
                form.id = id;
            }
            
            var hiddenParamsDiv = document.createElement("div");
            hiddenParamsDiv.style.display = 'none';
            
            var appendFormParam = function(paramName, paramValue) { 
                var input = document.createElement("input");
                
                paramValue = typeof paramValue !== 'undefined' ? paramValue : '';
                
                input.setAttribute('type', 'hidden');
                input.setAttribute('name', paramName);
                input.setAttribute('value', paramValue);
                
                hiddenParamsDiv.appendChild(input)
            }
            
            for (var paramName in params) {
                appendFormParam(paramName, params[paramName]);
            }
            
            appendFormParam('WrapStyle', 'message');
            appendFormParam('CallbackName', id);
            
            form.appendChild(hiddenParamsDiv);
            
            if (!baseForm)
                document.body.appendChild(form);
                
            document.body.appendChild(iframe);
            
            form.submit();
            
            if (baseForm)
            {
                form.removeChild(hiddenParamsDiv);
                if (originalFormAction !== null)
                    form.setAttribute('action', originalFormAction);
                else
                    form.removeAttribute('action');
            }
            else
            {
                form.parentNode.removeChild(form);
            }
            
            return deferred.promise();
        };

        return Server;
    })();
})();
var nsGmx = window.nsGmx = window.nsGmx || {};

nsGmx.Auth = nsGmx.Auth || {};

nsGmx.Auth.ResourceServer = (function() {

    var extend = function(childClass, parentClass) {
        var F = function() {};
        F.prototype = parentClass.prototype;
        childClass.prototype = new F();
        childClass.superClass = parentClass.prototype;
    };

    /**
     * @class
     * @constructor
     * @param {AuthManager} authManager
     * @param {Object} options параметры сервера авторизации (TBD)
     */
    var ResourceServer = function(authManager, options) {
        this._id = options.id;
        this._root = options.root;
        this._authManager = authManager;
        authManager.$addResourceServer(this);
    };

    extend(ResourceServer, nsGmx.Auth.Server);
    
    var extendRequestMethod = function(requestFuncName) {
        return function(url, params, baseForm) {
            var self = this;
            var deferred = $.Deferred();

            var params = params || {};
            params.sync = this._authManager.$getAntiCsrfToken();
            
            ResourceServer.superClass[requestFuncName].call(this, url, params, baseForm).done(function(data) {
                data.Service = {
                    ServerId: self._id
                }
                
                if (data.Status === 'ok') {
                    deferred.resolve(data);
                } else {
                    deferred.reject(data);
                }
            }).fail(function(errors) {
                deferred.reject({
                    Status: 'error',
                    ErrorInfo: errors.ErrorInfo
                });
            });

            return deferred.promise();
        }
    }

    ResourceServer.prototype.sendGetRequest = extendRequestMethod('sendGetRequest');
    ResourceServer.prototype.sendImageRequest = extendRequestMethod('sendImageRequest');
    ResourceServer.prototype.sendPostRequest = extendRequestMethod('sendPostRequest');

    return ResourceServer;

})();
var nsGmx = window.nsGmx = window.nsGmx || {};

nsGmx.Auth = nsGmx.Auth || {};

nsGmx.Auth.AuthManager = (function() {
    /**
     * @class
     * @constructor
     * @param {Object} options параметры сервера авторизации (TBD)
     */
    var AuthManager = function(options) {
        // поддерживаем как минимум два события для
        // серверов ресурсов: login и logout
        this._authorizationEndpoint = options.authorizationEndpoint;
        this._userInfoEndpoint = options.userInfoEndpoint;
        this._redirectEndpointHtml = options.redirectEndpointHtml;
        this._redirectEndpointAshx = options.redirectEndpointAshx;
        this._redirectEndpointAshx2 = options.redirectEndpointAshx + '/?return_url=' + location.href;
        this._credentialLoginEndpoint = options.credentialLoginEndpoint;
        this._resourceServers = [];
        this._clientId = options.clientId || 1;
    };

    AuthManager.prototype = _.extend({}, Backbone.Events);

    // $ - это типа метод для friendly-классов. Как бы приватный, но классы серверов ресурсов его использовать могут.

    AuthManager.prototype.$getAntiCsrfToken = function() {
        var cookieName = "sync";
        var re = new RegExp('.*' + cookieName + '=([^;]+).*', 'i');
        var cookieValue = document.cookie.replace(re, '$1');
        return cookieValue;
    };

    /** Добавляет сервер ресурсов
     * Должна вызываться только из класса ResourceServer.
     * @param {ResourceServer} resourceServer
     */
    AuthManager.prototype.$addResourceServer = function(resourceServer) {
        this._resourceServers.push(resourceServer);
    };

    AuthManager.prototype._authorizeResourceServers = function() {
        var promises = [];
        for (var i = 0; i < this._resourceServers.length; i++) {
            var resourceServer = this._resourceServers[i];
            var promise = resourceServer.sendGetRequest('oAuth2/LoginDialog.ashx');
            promises.push(promise);
        }
        return $.when.apply(null, promises);
    };

    // посредством серверного скрипта на клиенте меняем code
    // на информацию о пользователе и куку sync
    AuthManager.prototype._processAuthorization = function(search) {
        var deferred = $.Deferred();

        var parseQueryString = function(search) {
            var a = search.slice(1).split('&');
            var o = {};
            for (var i = 0; i < a.length; i++) {
                var s = a[i].split('=');
                o[s[0]] = s[1];
            }
            return o;
        };

        // превращаем строку с параметрами в хеш
        var params = parseQueryString(search);

        if (params.error) {
            deferred.reject({
                Status: 'auth',
                Result: null,
                Error: {
                    message: params.error
                }
            });
        } else {
            $.ajax({
                url: this._redirectEndpointAshx + search,
                dataType: 'jsonp',
                jsonp: 'CallbackName'
            }).done(function(resp) {
                if (resp.Status === 'ok') {
                    deferred.resolve({
                        Status: 'ok',
                        Result: resp.Result
                    });
                } else {
                    deferred.reject({
                        Status: resp.Status,
                        Result: null
                    });
                }
            }).fail(function() {
                deferred.reject({
                    Status: 'network',
                    Result: null,
                    Error: {
                        message: arguments[2]
                    }
                });
            });
        }

        return deferred.promise();
    };


    /** Получение информации о пользователе от AuthServer
     * @return {Function} promise(userInfo)
     */
    AuthManager.prototype.getUserInfo = function() {
        if (this._getUserInfoDeferred) {
            return this._getUserInfoDeferred.promise();
        }
        var deferred = this._getUserInfoDeferred = $.Deferred();

        function authorizationGrant(search) {
            // удаляем айфрейм и глобальную переменную
            setTimeout(function() {
                delete window.authorizationGrant;
                $('.authorizationIframe').remove();
            }, 0);

            this._processAuthorization(search).then(function(resp) {
                deferred.resolve(resp);
            }, function(err) {
                deferred.reject(err);
            })
        }

        // посылаем запросы на все сервера ресурсов
        // когда они все ответят ..
        this._authorizeResourceServers().done(function() {
            // .. формируем параметры state и scope
            var scope = '';
            var state = '';
            for (var i = 0; i < arguments.length; i++) {
                var response = arguments[i];
                scope += response.Service.ServerId + ',';
                state += response.Result.State + ',';
            }
            scope = scope.slice(0, -1);
            state = state.slice(0, -1);

            // .. и посылаем запрос на сервер авторизации
            window.authorizationGrant = authorizationGrant.bind(this);
            $('<iframe/>', {
                'src': this._userInfoEndpoint + '/?client_id=1&redirect_uri=' + this._redirectEndpointHtml + '&scope=' + scope + '&state=' + state,
                'style': 'display: block !important; position: absolute; left: -99999px;'
            }).addClass('authorizationIframe').prependTo('body');
        }.bind(this)).fail(function() {
            deferred.reject({
                Status: 'error'
            });
        });
        return deferred.promise();
    };


    /** Принудительное перелогинивание пользователя.
     * Пользователь должен увидеть поля для ввода
     * логина/пароля (возможно, на сервере авторизации).
     * При успешной авторизации библиотека должна
     * произвести авторизацию пользователя на всех
     * подключенных серверах ресурсов
     * и только после этого resolve promise
     * @return {Function} promise(userInfo)
     */
    AuthManager.prototype.login = function(arg) {
        var foreignServer;
        var iframeContainer;
        if (typeof arg === 'string') {
            // обратная совместимость
            foreignServer = arg;
        } else if (typeof arg === 'object') {
            foreignServer = arg.foreignServer;
            iframeContainer = arg.iframeContainer;
        }

        var self = this;
        this._authorizeResourceServers().done(function() {
            // .. формируем параметры state и scope
            var scope = '';
            var state = '';
            for (var i = 0; i < arguments.length; i++) {
                var response = arguments[i];
                scope += response.Service.ServerId + ',';
                state += response.Result.State + ',';
            }
            scope = scope.slice(0, -1);
            state = state.slice(0, -1);

            var authUrl = self._authorizationEndpoint + '/?client_id=1' +
                '&redirect_uri=' + self._redirectEndpointAshx2 +
                '&scope=' + scope +
                '&state=' + state;

            if (foreignServer) {
                authUrl += '&authserver=' + foreignServer;
            }

            if (!iframeContainer) {
                window.open(authUrl, '_self');
            } else {
                window.authorizationGrant = authorizationGrant;

                $('.authorizationIframe').remove();

                $('<iframe>', {
                    'src': self._authorizationEndpoint +
                        '/?client_id=1' +
                        '&redirect_uri=' + self._redirectEndpointHtml +
                        '&redirect_uri_alt=' + self._redirectEndpointAshx2 +
                        '&scope=' + scope +
                        '&state=' + state
                }).addClass('authorizationIframe').prependTo(iframeContainer);

                function authorizationGrant() {
                    window.location.reload();
                }
            }
        });
    };

    /** Залогиниться, используя логин и пароль
     * @param  {String} login
     * @param  {String} password
     * @return {Promise}
     */
    AuthManager.prototype.loginWithCredentials = function(login, password) {
        // отправляем ajax-запрос на Handler/Login с логином и паролем
        // После этого пользователь считается залогиненным на my.
        // Затем вызываем getUserInfo()

        var deferred = $.Deferred();
        var self = this;

        $.ajax({
            url: this._credentialLoginEndpoint + '?login=' + encodeURIComponent(login) + '&password=' + encodeURIComponent(password),
            dataType: "jsonp"
        }).done(function(response) {
            if (response.Status.toLowerCase() === 'ok') {
                self.getUserInfo().done(function() {
                    deferred.resolve({
                        Status: 'ok',
                        Result: arguments[0].Result
                    });
                }).fail(function() {
                    deferred.reject({
                        Status: 'error',
                        Result: {
                            Message: 'authorization error'
                        }
                    });
                });
            } else if (response.Status.toLowerCase() === 'auth') {
                deferred.reject({
                    Status: 'auth',
                    Result: {
                        Message: response.Result.Message
                    }
                })
            } else {
                deferred.reject({
                    Status: 'error',
                    Result: {
                        Message: 'unknown error'
                    }
                });
            }
        }).fail(function() {
            deferred.reject({
                Status: 'network',
                Result: {
                    Message: 'network error'
                }
            });
        })

        return deferred.promise();
    };

    /** Принудительное разлогинивание пользователя.
     * В том числе и на серверах ресурсов
     * @return {Function} promise(status)
     */
    AuthManager.prototype.logout = function() {
        var deferred = $.Deferred();
        var promises = [];
        for (var i = 0; i < this._resourceServers.length; i++) {
            var resourceServer = this._resourceServers[i];
            var promise = resourceServer.sendGetRequest('oAuth2/Logout.ashx');
            promises.push(promise);
        }
        $.when.apply(promises, this).done(function() {
            if (this._clientId === 1) {
                $.ajax({
                    url: 'http://my.kosmosnimki.ru/Handler/Logout',
                    dataType: "jsonp"
                }).done(function() {
                    deferred.resolve({
                        Status: 'ok'
                    });
                    this.trigger('logout');
                }.bind(this)).fail(function() {
                    deferred.reject({
                        Status: 'network'
                    });
                }.bind(this));
            } else {
                deferred.resolve({
                    Status: 'ok'
                });
                this.trigger('logout');
            }
        }.bind(this)).fail(function() {
            deferred.reject({
                Status: 'error'
            })
        }.bind(this));
        return deferred.promise();
    };

    return AuthManager;
})();

/**
 * @namespace
 */
var nsGmx = window.nsGmx = window.nsGmx || {};

/**
 * @namespace
 */
nsGmx.Auth = nsGmx.Auth || {};

(function() {
    var resourceServersInstances = {};
    var resourceServersConstructors = {};
    var authManager;
    // строка, в которой перечислены псевдонимы используемых нами серверов ресурсов.
    // потребуется для синхронизации серверов ресурсов
    var scope;

    // зашиваем известные и часто-используемые ресурсы
    resourceServersConstructors['subscriptions'] = function() {
        return new nsGmx.Auth.ResourceServer(authManager, {
            id: 'subscriptions',
            root: 'http://fires.kosmosnimki.ru/SAPIv2'
        });
    };

    resourceServersConstructors['geomixer2'] = function() {
        return new nsGmx.Auth.ResourceServer(authManager, {
            id: 'geomixer2',
            root: 'http://maps2.kosmosnimki.ru'
        });
    };

    resourceServersConstructors['geomixer'] = function() {
        return new nsGmx.Auth.ResourceServer(authManager, {
            id: 'geomixer',
            root: 'http://maps.kosmosnimki.ru'
        });
    };

    resourceServersConstructors['geocode'] = function() {
        return new nsGmx.Auth.ResourceServer(authManager, {
            id: 'geocode',
            root: 'http://geocode.kosmosnimki.ru'
        });
    };

    nsGmx.Auth.getResourceServer = function(id) {
        if (!authManager) {
            authManager = nsGmx.Auth.getAuthManager();
        }
        // используем lazy instantiation для отложенного создания
        // необходимых нам компонентов
        if (!resourceServersInstances[id]) {
            resourceServersInstances[id] = resourceServersConstructors[id]();
            if (!scope) {
                scope = id;
            } else {
                scope += (',' + id);
            }
        }
        return resourceServersInstances[id];
    };

    nsGmx.Auth.getAuthManager = function() {
        // то же и с authManager
        if (!authManager) {
            authManager = new nsGmx.Auth.AuthManager({
                authorizationEndpoint: 'http://my.kosmosnimki.ru/Test/LoginDialog',
                userInfoEndpoint: 'http://my.kosmosnimki.ru/oAuth/LoginDialog',
                redirectEndpointHtml: location.href.replace(/[^\/]+$/, '') + 'oAuth2/oAuthCallback.htm',
                redirectEndpointAshx: location.href.replace(/[^\/]+$/, '') + 'oAuth2/oAuthCallback.ashx',
                credentialLoginEndpoint: 'http://my.kosmosnimki.ru/Handler/Login'
            });
        }
        return authManager;
    };
})();
