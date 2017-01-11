'use strict';

app.sugerencias = kendo.observable({
    onShow: function() {},
    afterShow: function() {}
});
app.localization.registerView('sugerencias');

// START_CUSTOM_CODE_sugerencias
// Add custom code here. For more information about custom code, see http://docs.telerik.com/platform/screenbuilder/troubleshooting/how-to-keep-custom-code-changes

// END_CUSTOM_CODE_sugerencias
(function(parent) {
    var dataProvider = app.data.backendServices,
        /// start global model properties
        /// end global model properties
        fetchFilteredData = function(paramFilter, searchFilter) {
            var model = parent.get('sugerenciasModel'),
                dataSource;

            if (model) {
                dataSource = model.get('dataSource');
            } else {
                parent.set('sugerenciasModel_delayedFetch', paramFilter || null);
                return;
            }

            if (paramFilter) {
                model.set('paramFilter', paramFilter);
            } else {
                model.set('paramFilter', undefined);
            }

            if (paramFilter && searchFilter) {
                dataSource.filter({
                    logic: 'and',
                    filters: [paramFilter, searchFilter]
                });
            } else if (paramFilter || searchFilter) {
                dataSource.filter(paramFilter || searchFilter);
            } else {
                dataSource.filter({});
            }
        },

        flattenLocationProperties = function(dataItem) {
            var propName, propValue,
                isLocation = function(value) {
                    return propValue && typeof propValue === 'object' &&
                        propValue.longitude && propValue.latitude;
                };

            for (propName in dataItem) {
                if (dataItem.hasOwnProperty(propName)) {
                    propValue = dataItem[propName];
                    if (isLocation(propValue)) {
                        dataItem[propName] =
                            kendo.format('Latitude: {0}, Longitude: {1}',
                                propValue.latitude, propValue.longitude);
                    }
                }
            }
        },
        dataSourceOptions = {
            type: 'everlive',
            transport: {
                typeName: 'sugerencias',
                dataProvider: dataProvider
            },
            change: function(e) {
                var data = this.data();
                for (var i = 0; i < data.length; i++) {
                    var dataItem = data[i];

                    /// start flattenLocation property
                    flattenLocationProperties(dataItem);
                    /// end flattenLocation property

                }
            },
            error: function(e) {

                if (e.xhr) {
                    var errorText = "";
                    try {
                        errorText = JSON.stringify(e.xhr);
                    } catch (jsonErr) {
                        errorText = e.xhr.responseText || e.xhr.statusText || 'An error has occurred!';
                    }
                    alert(errorText);
                }
            },
            schema: {
                model: {
                    fields: {
                        'pregunta': {
                            field: 'pregunta',
                            defaultValue: ''
                        },
                        'respuesta': {
                            field: 'respuesta',
                            defaultValue: ''
                        },
                    }
                }
            },
            serverFiltering: true,
            serverSorting: true,
            sort: {
                field: 'CreatedAt',
                dir: 'desc'
            },
            serverPaging: true,
            pageSize: 50
        },
        /// start data sources
        /// end data sources
        sugerenciasModel = kendo.observable({
            _dataSourceOptions: dataSourceOptions,
            fixHierarchicalData: function(data) {
                var result = {},
                    layout = {};

                $.extend(true, result, data);

                (function removeNulls(obj) {
                    var i, name,
                        names = Object.getOwnPropertyNames(obj);

                    for (i = 0; i < names.length; i++) {
                        name = names[i];

                        if (obj[name] === null) {
                            delete obj[name];
                        } else if ($.type(obj[name]) === 'object') {
                            removeNulls(obj[name]);
                        }
                    }
                })(result);

                (function fix(source, layout) {
                    var i, j, name, srcObj, ltObj, type,
                        names = Object.getOwnPropertyNames(layout);

                    if ($.type(source) !== 'object') {
                        return;
                    }

                    for (i = 0; i < names.length; i++) {
                        name = names[i];
                        srcObj = source[name];
                        ltObj = layout[name];
                        type = $.type(srcObj);

                        if (type === 'undefined' || type === 'null') {
                            source[name] = ltObj;
                        } else {
                            if (srcObj.length > 0) {
                                for (j = 0; j < srcObj.length; j++) {
                                    fix(srcObj[j], ltObj[0]);
                                }
                            } else {
                                fix(srcObj, ltObj);
                            }
                        }
                    }
                })(result, layout);

                return result;
            },
            itemClick: function(e) {
                var dataItem = e.dataItem || sugerenciasModel.originalItem;

                app.mobileApp.navigate('#components/sugerencias/details.html?uid=' + dataItem.uid);

            },
            addClick: function() {
                app.mobileApp.navigate('#components/sugerencias/add.html');
            },
            deleteItem: function() {
                var dataSource = sugerenciasModel.get('dataSource');

                dataSource.remove(this.originalItem);

                dataSource.one('sync', function() {
                    app.mobileApp.navigate('#:back');
                });

                dataSource.one('error', function() {
                    dataSource.cancelChanges();
                });

                dataSource.sync();
            },
            deleteClick: function() {
                var that = this;

                navigator.notification.confirm(
                    'Are you sure you want to delete this item?',
                    function(index) {
                        //'OK' is index 1
                        //'Cancel' - index 2
                        if (index === 1) {
                            that.deleteItem();
                        }
                    },
                    '', ['OK', 'Cancel']
                );
            },
            detailsShow: function(e) {
                var uid = e.view.params.uid,
                    dataSource = sugerenciasModel.get('dataSource'),
                    itemModel = dataSource.getByUid(uid);

                sugerenciasModel.setCurrentItemByUid(uid);

                /// start detail form show
                /// end detail form show
            },
            setCurrentItemByUid: function(uid) {
                var item = uid,
                    dataSource = sugerenciasModel.get('dataSource'),
                    itemModel = dataSource.getByUid(item);

                if (!itemModel.pregunta) {
                    itemModel.pregunta = String.fromCharCode(160);
                }

                /// start detail form initialization
                /// end detail form initialization

                sugerenciasModel.set('originalItem', itemModel);
                sugerenciasModel.set('currentItem',
                    sugerenciasModel.fixHierarchicalData(itemModel));

                return itemModel;
            },
            linkBind: function(linkString) {
                var linkChunks = linkString.split('|');
                if (linkChunks[0].length === 0) {
                    return this.get('currentItem.' + linkChunks[1]);
                }
                return linkChunks[0] + this.get('currentItem.' + linkChunks[1]);
            },
            /// start masterDetails view model functions
            /// end masterDetails view model functions
            currentItem: {}
        });

    parent.set('addItemViewModel', kendo.observable({
        /// start add model properties
        /// end add model properties
        /// start add model functions
        /// end add model functions
        onShow: function(e) {
            this.set('addFormData', {
                cancha: '',
                puntuacion: '',
                pregunta: '',
                /// start add form data init
                /// end add form data init
            });
            /// start add form show
            /// end add form show
        },
        onCancel: function() {
            /// start add model cancel
            /// end add model cancel
        },
        onSaveClick: function(e) {
            var addFormData = this.get('addFormData'),
                filter = sugerenciasModel && sugerenciasModel.get('paramFilter'),
                dataSource = sugerenciasModel.get('dataSource'),
                addModel = {};

            function saveModel(data) {
                /// start add form data save
                addModel.cancha = addFormData.cancha;
                addModel.puntuacion = addFormData.puntuacion;
                addModel.pregunta = addFormData.pregunta;
                /// end add form data save

                dataSource.add(addModel);
                dataSource.one('change', function(e) {
                    app.mobileApp.navigate('#:back');
                });

                dataSource.sync();
                app.clearFormDomData('add-item-view');
            };

            /// start add form save
            /// end add form save
            /// start add form save handler
            saveModel();
            /// end add form save handler
        }
    }));

    if (typeof dataProvider.sbProviderReady === 'function') {
        dataProvider.sbProviderReady(function dl_sbProviderReady() {
            parent.set('sugerenciasModel', sugerenciasModel);
            var param = parent.get('sugerenciasModel_delayedFetch');
            if (typeof param !== 'undefined') {
                parent.set('sugerenciasModel_delayedFetch', undefined);
                fetchFilteredData(param);
            }
        });
    } else {
        parent.set('sugerenciasModel', sugerenciasModel);
    }

    parent.set('onShow', function(e) {
        var param = e.view.params.filter ? JSON.parse(e.view.params.filter) : null,
            isListmenu = false,
            backbutton = e.view.element && e.view.element.find('header [data-role="navbar"] .backButtonWrapper'),
            dataSourceOptions = sugerenciasModel.get('_dataSourceOptions'),
            dataSource;

        if (param || isListmenu) {
            backbutton.show();
            backbutton.css('visibility', 'visible');
        } else {
            if (e.view.element.find('header [data-role="navbar"] [data-role="button"]').length) {
                backbutton.hide();
            } else {
                backbutton.css('visibility', 'hidden');
            }
        }

        dataSource = new kendo.data.DataSource(dataSourceOptions);
        sugerenciasModel.set('dataSource', dataSource);
        fetchFilteredData(param);
    });

})(app.sugerencias);

// START_CUSTOM_CODE_sugerenciasModel
// Add custom code here. For more information about custom code, see http://docs.telerik.com/platform/screenbuilder/troubleshooting/how-to-keep-custom-code-changes

// END_CUSTOM_CODE_sugerenciasModel