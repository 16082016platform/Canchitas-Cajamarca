'use strict';

app.canchas = kendo.observable({
    onShow: function () { },
    afterShow: function () {
        //app.canchas.canchasModel.dataSource.sort({ field: "distancia", dir: "desc" });
    }
});
app.localization.registerView('canchas');

// START_CUSTOM_CODE_canchas
// Add custom code here. For more information about custom code, see http://docs.telerik.com/platform/screenbuilder/troubleshooting/how-to-keep-custom-code-changes

// END_CUSTOM_CODE_canchas
(function (parent) {
    var dataProvider = app.data.backendServices,
        /// start global model properties

        processImage = function (img) {

            function isAbsolute(img) {
                if (img && (img.slice(0, 5) === 'http:' || img.slice(0, 6) === 'https:' || img.slice(0, 2) === '//' || img.slice(0, 5) === 'data:')) {
                    return true;
                }
                return false;
            }

            if (!img) {
                var empty1x1png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVQI12NgYAAAAAMAASDVlMcAAAAASUVORK5CYII=';
                img = 'data:image/png;base64,' + empty1x1png;
            } else if (!isAbsolute(img)) {
                var setup = dataProvider.setup || {};
                img = setup.scheme + ':' + setup.url + setup.appId + '/Files/' + img + '/Download';
            }

            return img;
        },

        markerLayers = {},
        getLocation = function (options) {
            var d = new $.Deferred();
            if (options === undefined) {
                options = {
                    enableHighAccuracy: true
                };
            }
            navigator.geolocation.getCurrentPosition(
                function (position) {
                    d.resolve(position);
                },
                function (error) {
                    d.reject(error);
                },
                options);
            return d.promise();
        },


        processDistance = function (data, id, i, callback) {
            getLocation()
                .then(function (userPosition) {
                    var localizacion = data.split(",");
                    var latitude = localizacion[0].replace("Latitude: ", "");
                    var longitude = localizacion[1].replace("Longitude: ", "");

                    var position = L.latLng(userPosition.coords.latitude, userPosition.coords.longitude),
                        markerPosition = L.latLng(latitude, longitude),
                        distance;
                    distance = Math.round(position.distanceTo(markerPosition));
                    if (distance > 1000) {
                        distance /= 1000;
                        distance += " km";
                    } else {
                        distance += " m";
                    }
                    $("#canchasScreen p#distancia" + id).text(distance);
                    var distancia = canchasModel.dataSource.at(i);
                    distancia.set("distancia", distance);
                    callback(distance);
                });
        },

        getDistance = function (data, callback) {
            getLocation()
                .then(function (userPosition) {
                    var localizacion = data.split(",");
                    var latitude = localizacion[0].replace("Latitude: ", "");
                    var longitude = localizacion[1].replace("Longitude: ", "");

                    var position = L.latLng(userPosition.coords.latitude, userPosition.coords.longitude),
                        markerPosition = L.latLng(latitude, longitude),
                        distance;
                    distance = Math.round(position.distanceTo(markerPosition));
                    if (distance > 1000) {
                        distance /= 1000;
                        distance += " km";
                    } else {
                        distance += " m";
                    }
                    callback(distance);
                });
        },

        getCoordinates = function (data) {
            var localizacion = data.split(",");
            var latitude = localizacion[0].replace("Latitude: ", "");
            var longitude = localizacion[1].replace("Longitude: ", "");
            return latitude + ' Latitude <br />' + longitude + ' Longitude';
        },
        /// end global model properties

        fetchFilteredData = function (paramFilter, searchFilter) {
            var model = parent.get('canchasModel'),
                dataSource;

            if (model) {
                dataSource = model.get('dataSource');
            } else {
                parent.set('canchasModel_delayedFetch', paramFilter || null);
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
                read: {
                    headers: {
                        'X-Everlive-Expand': {
                            "grass": {
                                "TargetTypeName": "grasses"
                            }
                        }
                    }
                },
                typeName: 'canchas',
                dataProvider: dataProvider
            },
            change: function (e) {
                var data = this.data();
                for (var i = 0; i < data.length; i++) {
                    var dataItem = data[i];

                    flattenLocationProperties(dataItem);

                    if (dataItem['distancia'] !== undefined) {
                        return;
                    }



                    dataItem['fotoUrl'] =
                        processImage(dataItem['foto']);


                    /// start flattenLocation property

                    //dataItem['xxx'] =
                    //  getDistancia(dataItem['localizacion']);
                    processDistance(dataItem['localizacion'], dataItem['id'], i, function (value) {

                    });
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
                        'nombre': {
                            field: 'nombre',
                            defaultValue: ''
                        },
                        'localizacion': {
                            field: 'localizacion',
                            defaultValue: ''
                        },
                        'foto': {
                            field: 'foto',
                            defaultValue: ''
                        },
                        'distancia': {
                            defaultValue: '',
                        },
                    }
                }
            },
            serverFiltering: true,
            sort: { field: "distancia", dir: "desc" }
        },
        /// start data sources
        /// end data sources
        canchasModel = kendo.observable({
            _dataSourceOptions: dataSourceOptions,
            searchChange: function (e) {
                var searchVal = e.target.value,
                    searchFilter;

                if (searchVal) {
                    searchFilter = {
                        field: 'nombre',
                        operator: 'contains',
                        value: searchVal
                    };
                }
                fetchFilteredData(canchasModel.get('paramFilter'), searchFilter);
            },
            fixHierarchicalData: function (data) {
                var result = {},
                    layout = {
                        "grass": [{}]
                    };

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
                var dataItem = e.dataItem || canchasModel.originalItem;

                app.mobileApp.navigate('#components/canchas/details.html?uid=' + dataItem.uid);

            },
            detailsShow: function (e) {
                var uid = e.view.params.uid,
                    dataSource = canchasModel.get('dataSource'),
                    itemModel = dataSource.getByUid(uid);

                canchasModel.setCurrentItemByUid(uid);

                /// start detail form show

                getDistance(itemModel.localizacion, function (value) {
                    canchasModel.set('getDistance', value);
                });

                canchasModel.set('getCoordinates', getCoordinates(itemModel.localizacion));

                /// end detail form show

            },
            setCurrentItemByUid: function (uid) {
                var item = uid,
                    dataSource = canchasModel.get('dataSource'),
                    itemModel = dataSource.getByUid(item);

                if (!itemModel.nombre) {
                    itemModel.nombre = String.fromCharCode(160);
                }

                /// start detail form initialization

                itemModel.fotoImage = processImage(itemModel.foto);

                /// end detail form initialization

                canchasModel.set('originalItem', itemModel);
                canchasModel.set('currentItem',
                    canchasModel.fixHierarchicalData(itemModel));

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
            currentItem: {
                "grass": []
            }
        });

    if (typeof dataProvider.sbProviderReady === 'function') {
        dataProvider.sbProviderReady(function dl_sbProviderReady() {
            parent.set('canchasModel', canchasModel);
            var param = parent.get('canchasModel_delayedFetch');
            if (typeof param !== 'undefined') {
                parent.set('canchasModel_delayedFetch', undefined);
                fetchFilteredData(param);
            }
        });
    } else {
        parent.set('canchasModel', canchasModel);
    }

    parent.set('onShow', function (e) {
        var param = e.view.params.filter ? JSON.parse(e.view.params.filter) : null,
            isListmenu = false,
            backbutton = e.view.element && e.view.element.find('header [data-role="navbar"] .backButtonWrapper'),
            dataSourceOptions = canchasModel.get('_dataSourceOptions'),
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
        canchasModel.set('dataSource', dataSource);
        fetchFilteredData(param);
    });

})(app.canchas);

// START_CUSTOM_CODE_canchasModel
// Add custom code here. For more information about custom code, see http://docs.telerik.com/platform/screenbuilder/troubleshooting/how-to-keep-custom-code-changes

// END_CUSTOM_CODE_canchasModel

function goToReservas(e) {
    var dataItem = app.canchas.canchasModel.get('currentItem');
    var fecha = new Date();
    fecha = kendo.toString(fecha, "MM-dd-yyyy");
    console.log(dataItem);
    console.log(dataItem.grass);
    var filter = [
        { field: "cancha", operator: "eq", value: dataItem.Id},
        { field: "fecha", operator: "eq", value: kendo.parseDate(fecha,"MM-dd-yyyy") }
    ];
    app.mobileApp.navigate('#components/reservas/view.html?filter=' + encodeURIComponent(JSON.stringify(filter)));
}

/*function closeModalViewLogin() {
    $("#modalview-login").kendoMobileModalView("close");
}

function onClick() {
    var mv = $("#modalview-login").data("kendoMobileModalView");
    mv.shim.popup.options.animation.open.effects = "zoom";
    mv.open();
}*/

