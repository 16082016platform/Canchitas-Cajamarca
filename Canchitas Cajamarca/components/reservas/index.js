'use strict';

app.reservas = kendo.observable({
    onShow: function () { },
    afterShow: function () { }
});
app.localization.registerView('reservas');

// START_CUSTOM_CODE_reservas
// Add custom code here. For more information about custom code, see http://docs.telerik.com/platform/screenbuilder/troubleshooting/how-to-keep-custom-code-changes

// END_CUSTOM_CODE_reservas
(function (parent) {
    var dataProvider = app.data.backendServices,
        horas = [],
        costo = 0,
        /// start global model properties
        /// end global model properties
        fetchFilteredData = function (paramFilter, searchFilter) {
            horas = [];
            costo = 0;
            var model = parent.get('reservasModel'),
                dataSource;

            if (model) {
                dataSource = model.get('dataSource');
            } else {
                parent.set('reservasModel_delayedFetch', paramFilter || null);
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
            $('#reservasScreen [id^=Hora]').removeClass('disabled');
            $('#reservasScreen [id^="input"]').prop("checked", false);

            dataSource.fetch(function () {
                var data = this.data();
                for (var i = 0; i < data.length; i++) {
                    for (var j = 0; j < data[i].horas.length; j++) {
                        $("#Hora" + data[i].horas[j]).addClass('disabled');
                    }
                }
            }).then(function () {
                kendo.mobile.application.hideLoading();
            });
        },

        flattenLocationProperties = function (dataItem) {
            var propName, propValue,
                isLocation = function (value) {
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
                typeName: 'reservas',
                dataProvider: dataProvider
            },
            change: function (e) {
                var data = this.data();
                for (var i = 0; i < data.length; i++) {
                    var dataItem = data[i];

                    /// start flattenLocation property
                    flattenLocationProperties(dataItem);
                    /// end flattenLocation property

                }
            },
            error: function (e) {

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
                        'fecha': {
                            field: 'fecha',
                            defaultValue: ''
                        },
                        'estado': {
                            field: 'estado',
                            defaultValue: ''
                        },
                    }
                }
            },
            serverFiltering: true,
            serverSorting: true,
            sort: {
                field: 'estado',
                dir: 'asc'
            },
        },
        /// start data sources
        /// end data sources
        reservasModel = kendo.observable({
            _dataSourceOptions: dataSourceOptions,
            buscarReservas: function (e) {
                $("#editableListForm60").hide(0, function () {
                    kendo.mobile.application.showLoading();
                });
                $("#editableListForm60").hide(500, function () {

                });
                $("#editableListForm60").show(1500, function () {
                    var filter = [
                        { field: "grass", operator: "eq", value: $("#grassAdd").val() },
                        { field: "fecha", operator: "eq", value: $("#fechaAdd").val() + "T05:00:00.000Z" }
                    ];
                    fetchFilteredData(filter);
                });
            },
            reservarHora: function (e) {
                //console.log($("#" + e.currentTarget.id).is(':checked'));
                //console.log(e.currentTarget.id.replace('input', ''));
                var h = parseInt(e.currentTarget.id.replace('input', '')),
                    costodia = parseInt($("#grassAdd option:selected").attr("costodia")),
                    costonoche = parseInt($("#grassAdd option:selected").attr("costonoche")),
                    costohora = parseInt($("#grassAdd option:selected").attr("costohora"));
                if ($("#" + e.currentTarget.id).is(':checked')) {
                    horas.push(h);
                    if (costohora < h) {
                        costo += costodia;
                    } else {
                        costo += costonoche;
                    }
                } else {
                    horas.splice(horas.indexOf(h, 1));
                    if (costohora < h) {
                        costo -= costodia;
                    } else {
                        costo -= costonoche;
                    }
                }
                console.log(horas);
                console.log(costo);
                $("#costoAdd").val(costo);
            },
            searchChange: function (e) {
                var searchVal = e.target.value,
                    searchFilter;

                if (searchVal) {
                    searchFilter = {
                        field: 'estado',
                        operator: 'contains',
                        value: searchVal
                    };
                }
                fetchFilteredData(reservasModel.get('paramFilter'), searchFilter);
            },
            fixHierarchicalData: function (data) {
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
            itemClick: function (e) {
                var dataItem = e.dataItem || reservasModel.originalItem;

                app.mobileApp.navigate('#components/reservas/details.html?uid=' + dataItem.uid);

            },
            addClick: function () {
                app.mobileApp.navigate('#components/reservas/add.html');
            },
            editClick: function () {
                var uid = this.originalItem.uid;
                app.mobileApp.navigate('#components/reservas/edit.html?uid=' + uid);
            },
            deleteItem: function () {
                var dataSource = reservasModel.get('dataSource');

                dataSource.remove(this.originalItem);

                dataSource.one('sync', function () {
                    app.mobileApp.navigate('#:back');
                });

                dataSource.one('error', function () {
                    dataSource.cancelChanges();
                });

                dataSource.sync();
            },
            deleteClick: function () {
                var that = this;

                navigator.notification.confirm(
                    'Are you sure you want to delete this item?',
                    function (index) {
                        //'OK' is index 1
                        //'Cancel' - index 2
                        if (index === 1) {
                            that.deleteItem();
                        }
                    },
                    '', ['OK', 'Cancel']
                );
            },
            detailsShow: function (e) {
                var uid = e.view.params.uid,
                    dataSource = reservasModel.get('dataSource'),
                    itemModel = dataSource.getByUid(uid);

                reservasModel.setCurrentItemByUid(uid);

                /// start detail form show
                /// end detail form show
            },
            setCurrentItemByUid: function (uid) {
                var item = uid,
                    dataSource = reservasModel.get('dataSource'),
                    itemModel = dataSource.getByUid(item);

                if (!itemModel.fecha) {
                    itemModel.fecha = String.fromCharCode(160);
                }

                /// start detail form initialization
                /// end detail form initialization

                reservasModel.set('originalItem', itemModel);
                reservasModel.set('currentItem',
                    reservasModel.fixHierarchicalData(itemModel));

                return itemModel;
            },
            linkBind: function (linkString) {
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
        onShow: function (e) {
            this.set('addFormData', {
                fechaAdd: '',
                horasAdd: '',
                costoAdd: '',
                grassAdd: '',
                /// start add form data init
                /// end add form data init
            });
            /// start add form show
            /// end add form show
        },
        onCancel: function () {
            /// start add model cancel
            /// end add model cancel
        },
        onSaveClick: function (e) {
            var addFormData = this.get('addFormData'),
                filter = reservasModel && reservasModel.get('paramFilter'),
                dataSource = reservasModel.get('dataSource'),
                addModel = {};

            function saveModel(data) {
                /// start add form data save
                addModel.fecha = addFormData.fechaAdd;
                addModel.costo = addFormData.horasAdd;
                addModel.costo = addFormData.costoAdd;
                addModel.grass = addFormData.grassAdd;
                /// end add form data save

                dataSource.add(addModel);
                dataSource.one('change', function (e) {
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

    parent.set('editItemViewModel', kendo.observable({
        /// start edit model properties
        /// end edit model properties
        /// start edit model functions
        /// end edit model functions
        editFormData: {},
        onShow: function (e) {
            var that = this,
                itemUid = e.view.params.uid,
                dataSource = reservasModel.get('dataSource'),
                itemData = dataSource.getByUid(itemUid),
                fixedData = reservasModel.fixHierarchicalData(itemData);

            /// start edit form before itemData
            /// end edit form before itemData

            this.set('itemData', itemData);
            this.set('editFormData', {
                fechaEdit: itemData.fecha,
                costoEdit: itemData.costo,
                estadoEdit: itemData.estado,
                grassEdit: itemData.grass,
                /// start edit form data init
                /// end edit form data init
            });

            /// start edit form show
            /// end edit form show
        },
        linkBind: function (linkString) {
            var linkChunks = linkString.split(':');
            return linkChunks[0] + ':' + this.get('itemData.' + linkChunks[1]);
        },
        onSaveClick: function (e) {
            var that = this,
                editFormData = this.get('editFormData'),
                itemData = this.get('itemData'),
                dataSource = reservasModel.get('dataSource');

            /// edit properties
            itemData.set('fecha', editFormData.fechaEdit);
            itemData.set('costo', editFormData.costoEdit);
            itemData.set('estado', editFormData.estadoEdit);
            itemData.set('grass', editFormData.grassEdit);
            /// start edit form data save
            /// end edit form data save

            function editModel(data) {
                /// start edit form data prepare
                /// end edit form data prepare
                dataSource.one('sync', function (e) {
                    /// start edit form data save success
                    /// end edit form data save success

                    app.mobileApp.navigate('#:back');
                });

                dataSource.one('error', function () {
                    dataSource.cancelChanges(itemData);
                });

                dataSource.sync();
                app.clearFormDomData('edit-item-view');
            };
            /// start edit form save
            /// end edit form save
            /// start edit form save handler
            editModel();
            /// end edit form save handler
        },
        onCancel: function () {
            /// start edit form cancel
            /// end edit form cancel
        }
    }));

    if (typeof dataProvider.sbProviderReady === 'function') {
        dataProvider.sbProviderReady(function dl_sbProviderReady() {
            parent.set('reservasModel', reservasModel);
            var param = parent.get('reservasModel_delayedFetch');
            if (typeof param !== 'undefined') {
                parent.set('reservasModel_delayedFetch', undefined);
                fetchFilteredData(param);
            }
        });
    } else {
        parent.set('reservasModel', reservasModel);
    }

    parent.set('onShow', function (e) {
        kendo.mobile.application.showLoading();
        $('#reservasScreen [id^=Hora]').removeClass('disabled');
        var param = e.view.params.filter ? JSON.parse(e.view.params.filter) : null,
            isListmenu = false,
            backbutton = e.view.element && e.view.element.find('header [data-role="navbar"] .backButtonWrapper'),
            dataSourceOptions = reservasModel.get('_dataSourceOptions'),
            dataSource,
            cancha = e.view.params.cancha,
            dia = e.view.params.dia,
            grass = JSON.parse(e.view.params.grass),
            fecha = kendo.parseDate(e.view.params.fecha, "MM-dd-yyyy");

        var max = new Date(fecha);
        max.setMonth(max.getMonth() + 1);
        $("#fechaAdd").val(kendo.toString(fecha, "yyyy-MM-dd"));
        $("#fechaAdd").attr("min", kendo.toString(fecha, "yyyy-MM-dd"));
        $("#fechaAdd").attr("max", kendo.toString(max, "yyyy-MM-dd"));

        $("#grassAdd").html("");
        for (var i = 0; i < grass.length; i++) {
            $("#grassAdd").append('<option value="' + grass[i].Id + '" costohora="' + grass[i].costohora + '" costodia="' + grass[i].costodia + '" costonoche="' + grass[i].costonoche + '">' + grass[i].descripcion + ' ' + grass[i].dimenciones + '</option>');
        }


        var fieldsExp = {
            "cancha": cancha
        };
        var dsHorarios = new kendo.data.DataSource({
            type: 'everlive',
            transport: {
                typeName: 'horarios',
                dataProvider: dataProvider,
                read: {
                    headers: {
                        "X-Everlive-Filter": JSON.stringify(fieldsExp)
                    }
                }
            }
        });

        dsHorarios.fetch(function () {
            $('#reservasScreen [id^=Hora]').removeClass('invisible');
            var data = this.data();
            switch (parseInt(dia)) {
                case 1:
                    var html = [];
                    for (var i = 0; i < 24; i++) {
                        if (data[0].Lunes[i] == false) {
                            $("#Hora" + i).addClass('invisible');
                        } else {
                            $("#Hora" + i).removeClass('invisible');
                        }
                    }
                    break;
                case 2:
                    var html = [];
                    for (var i = 0; i < 24; i++) {
                        if (data[0].Martes[i] == false) {
                            $("#Hora" + i).addClass('invisible');
                        } else {
                            $("#Hora" + i).removeClass('invisible');
                        }
                    }
                    break;
                case 3:
                    var html = [];
                    for (var i = 0; i < 24; i++) {
                        if (data[0].Miercoles[i] == false) {
                            $("#Hora" + i).addClass('invisible');
                        } else {
                            $("#Hora" + i).removeClass('invisible');
                        }
                    }
                    break;
                case 4:
                    var html = [];
                    for (var i = 0; i < 24; i++) {
                        if (data[0].Jueves[i] == false) {
                            $("#Hora" + i).addClass('invisible');
                        } else {
                            $("#Hora" + i).removeClass('invisible');
                        }
                    }
                    break;
                case 5:
                    var html = [];
                    for (var i = 0; i < 24; i++) {
                        if (data[0].Viernes[i] == false) {
                            $("#Hora" + i).addClass('invisible');
                        } else {
                            $("#Hora" + i).removeClass('invisible');
                        }
                    }
                    break;
                case 6:
                    var html = [];
                    for (var i = 0; i < 24; i++) {
                        if (data[0].Sabado[i] == false) {
                            $("#Hora" + i).addClass('invisible');
                        } else {
                            $("#Hora" + i).removeClass('invisible');
                        }
                    }
                    break;
                default:
                    var html = [];
                    for (var i = 0; i < 24; i++) {
                        if (data[0].Domingo[i] == false) {
                            $("#Hora" + i).addClass('invisible');
                        } else {
                            $("#Hora" + i).removeClass('invisible');
                        }
                    }
                    break;
            }
        })
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
        reservasModel.set('dataSource', dataSource);
        fetchFilteredData(param);
    });

})(app.reservas);


// START_CUSTOM_CODE_reservasModel
// Add custom code here. For more information about custom code, see http://docs.telerik.com/platform/screenbuilder/troubleshooting/how-to-keep-custom-code-changes

// END_CUSTOM_CODE_reservasModel