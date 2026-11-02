sap.ui.controller(
    "customer.zfin.f0708.excel.ext.controller.S1Custom",
    {

        onInit: function () {
            // Sin lógica adicional
        },


        onAfterRendering: function () {

            var aTables = [
                {
                    tableId: "tree_all",
                    toolbarId: "toolbar_tree_all",
                    personalizerId: "button_table_personalizer_tree_all",
                    title: "All Accounts",
                    fileName: "F0708_All_Accounts.xlsx"
                },
                {
                    tableId: "tree_bs",
                    toolbarId: "toolbar_tree_bs",
                    personalizerId: "button_table_personalizer_tree_bs",
                    title: "Balance Sheet",
                    fileName: "F0708_Balance_Sheet.xlsx"
                },
                {
                    tableId: "tree_pl",
                    toolbarId: "toolbar_tree_pl",
                    personalizerId: "button_table_personalizer_tree_pl",
                    title: "Profit & Loss",
                    fileName: "F0708_Profit_Loss.xlsx"
                },
                {
                    tableId: "tree_notes",
                    toolbarId: "toolbar_tree_notes",
                    personalizerId: "button_table_personalizer_tree_notes",
                    title: "Notes",
                    fileName: "F0708_Notes.xlsx"
                }
            ];

            aTables.forEach(
                function (oConfig) {
                    this._addExcelButton(oConfig);
                }.bind(this)
            );
        },


        _addExcelButton: function (oConfig) {

            var oToolbar = this.byId(
                oConfig.toolbarId
            );

            if (!oToolbar) {
                return;
            }

            var sButtonId =
                "z_button_export_excel_" +
                oConfig.tableId;

            /*
             * Evitar duplicar el botón cuando
             * onAfterRendering se ejecute nuevamente.
             */
            if (this.byId(sButtonId)) {
                return;
            }

            var oButton = new sap.m.Button(
                this.createId(sButtonId),
                {
                    icon: "sap-icon://excel-attachment",
                    tooltip: "Exportar a Excel",
                    type: "Transparent",

                    press: function () {

                        this.onExportExcel(
                            oConfig.tableId,
                            oConfig.title,
                            oConfig.fileName
                        );

                    }.bind(this)
                }
            );

            var aContent =
                oToolbar.getContent();

            var iPosition =
                aContent.length;

            /*
             * Colocar Excel antes del botón
             * de personalización.
             */
            for (
                var i = 0;
                i < aContent.length;
                i++
            ) {

                if (
                    aContent[i]
                        .getId()
                        .indexOf(
                            oConfig.personalizerId
                        ) !== -1
                ) {

                    iPosition = i;
                    break;
                }
            }

            oToolbar.insertContent(
                oButton,
                iPosition
            );
        },


        onExportExcel: function (
            sTableId,
            sTitle,
            sFileName
        ) {

            /*
             * Obtener tabla.
             */
            var oTable =
                this.byId(sTableId);

            if (!oTable) {

                sap.m.MessageBox.error(
                    "No se encontró la tabla."
                );

                return;
            }


            /*
             * Obtener binding.
             */
            var oBinding =
                oTable.getBinding("rows");

            if (!oBinding) {

                sap.m.MessageToast.show(
                    "Ejecuta primero el reporte."
                );

                return;
            }


            /*
             * Obtener modelo.
             */
            var oModel =
                oBinding.getModel();

            if (!oModel) {

                sap.m.MessageBox.error(
                    "No se encontró el modelo de datos."
                );

                return;
            }


            /*
             * Obtener árbol completo.
             */
            var sBindingPath =
                oBinding.getPath();

            var oRoot =
                oModel.getProperty(
                    sBindingPath
                );

            if (!oRoot) {

                sap.m.MessageToast.show(
                    "No existen datos para exportar."
                );

                return;
            }


            /*
             * Recuperar filtro estándar node_type.
             *
             * All Accounts:
             *   sin filtro
             *
             * Balance Sheet:
             *   TypeBS
             *
             * Profit & Loss:
             *   NoType
             */
            var sNodeTypeFilter = "";

            if (
                oBinding.aFilters &&
                oBinding.aFilters.length > 0
            ) {

                oBinding.aFilters.some(
                    function (oFilter) {

                        if (
                            oFilter.sPath ===
                            "node_type"
                        ) {

                            sNodeTypeFilter =
                                oFilter.oValue1 ||
                                "";

                            return true;
                        }

                        return false;
                    }
                );
            }


            /*
             * Aplanar jerarquía.
             */
            var aData = [];


            function flattenNode(oNode) {

                if (
                    !oNode ||
                    typeof oNode !== "object"
                ) {
                    return;
                }


                /*
                 * Determinar si el nodo corresponde
                 * a la pestaña seleccionada.
                 */
                var bIncludeNode = true;

                if (sNodeTypeFilter) {

                    var sNodeType =
                        oNode.node_type ||
                        "";

                    bIncludeNode =
                        sNodeType.indexOf(
                            sNodeTypeFilter
                        ) !== -1;
                }


                /*
                 * Agregar nodo financiero.
                 */
                if (
                    oNode.FinancialStatementItem !==
                    undefined &&
                    bIncludeNode
                ) {

                    aData.push({

                        Nivel:
                            oNode
                                .FinStatementHierarchyLevelVal ||
                            "",

                        Descripcion:
                            oNode
                                .FinancialStatementItemText ||
                            "",

                        Cuenta:
                            oNode
                                .OperativeGLAccount ||
                            "",

                        NombreCuenta:
                            oNode
                                .OperativeGLAccountName ||
                            "",

                        Periodo:
                            oNode
                                .ReportingPeriodAmount ||
                            "",

                        Comparacion:
                            oNode
                                .ComparisonPeriodAmount ||
                            "",

                        Diferencia:
                            oNode
                                .AbsoluteDifferenceAmount ||
                            "",

                        DiferenciaPorcentaje:
                            oNode
                                .RelativeDifferencePercent ||
                            "",

                        Moneda:
                            oNode.Currency ||
                            ""
                    });
                }


                /*
                 * Siempre recorrer los hijos.
                 */
                Object.keys(oNode)
                    .forEach(
                        function (sKey) {

                            if (
                                /^\d+$/.test(sKey)
                            ) {

                                flattenNode(
                                    oNode[sKey]
                                );
                            }
                        }
                    );
            }


            /*
             * Recorrer nodos raíz.
             */
            Object.keys(oRoot)
                .forEach(
                    function (sKey) {

                        if (
                            /^\d+$/.test(sKey)
                        ) {

                            flattenNode(
                                oRoot[sKey]
                            );
                        }
                    }
                );


            if (aData.length === 0) {

                sap.m.MessageToast.show(
                    "No existen datos para exportar en esta pestaña."
                );

                return;
            }


            /*
             * Preparar datos para Excel.
             */
            var aExcelData =
                aData.map(
                    function (oRow) {

                        var iNivel =
                            parseInt(
                                oRow.Nivel,
                                10
                            ) || 0;

                        /*
                         * Mantener visualmente
                         * la jerarquía mediante sangría.
                         */
                        var iIndent =
                            Math.max(
                                iNivel - 2,
                                0
                            );

                        var sIndent =
                            new Array(
                                iIndent + 1
                            ).join("    ");


                        return {

                            Nivel:
                                oRow.Nivel,

                            Descripcion:
                                sIndent +
                                oRow.Descripcion,

                            Cuenta:
                                oRow.Cuenta,

                            NombreCuenta:
                                oRow.NombreCuenta,

                            Periodo:
                                parseFloat(
                                    oRow.Periodo
                                ) || 0,

                            Comparacion:
                                parseFloat(
                                    oRow.Comparacion
                                ) || 0,

                            Diferencia:
                                parseFloat(
                                    oRow.Diferencia
                                ) || 0,

                            DiferenciaPorcentaje:
                                parseFloat(
                                    oRow
                                        .DiferenciaPorcentaje
                                ) || 0,

                            Moneda:
                                oRow.Moneda
                        };
                    }
                );


            /*
             * Cargar funcionalidad estándar
             * SAPUI5 para generar XLSX.
             */
            sap.ui.require(
                [
                    "sap/ui/export/Spreadsheet"
                ],
                function (Spreadsheet) {

                    var aColumns = [

                        {
                            label: "Nivel",
                            property: "Nivel",
                            type: "String",
                            width: 8
                        },

                        {
                            label: "Descripción",
                            property: "Descripcion",
                            type: "String",
                            width: 45
                        },

                        {
                            label: "Cuenta",
                            property: "Cuenta",
                            type: "String",
                            width: 15
                        },

                        {
                            label: "Nombre de cuenta",
                            property: "NombreCuenta",
                            type: "String",
                            width: 25
                        },

                        {
                            label: "Saldo período",
                            property: "Periodo",
                            type: "Number",
                            scale: 2,
                            width: 18
                        },

                        {
                            label: "Saldo comparación",
                            property: "Comparacion",
                            type: "Number",
                            scale: 2,
                            width: 18
                        },

                        {
                            label: "Diferencia absoluta",
                            property: "Diferencia",
                            type: "Number",
                            scale: 2,
                            width: 18
                        },

                        {
                            label: "Diferencia %",
                            property:
                                "DiferenciaPorcentaje",
                            type: "Number",
                            scale: 2,
                            width: 15
                        },

                        {
                            label: "Moneda",
                            property: "Moneda",
                            type: "String",
                            width: 10
                        }
                    ];


                    var oSettings = {

                        workbook: {

                            columns:
                                aColumns,

                            context: {

                                application:
                                    "F0708 - Balance Sheet/Income Statement",

                                title:
                                    sTitle
                            }
                        },

                        dataSource:
                            aExcelData,

                        fileName:
                            sFileName,

                        worker:
                            false
                    };


                    var oSpreadsheet =
                        new Spreadsheet(
                            oSettings
                        );


                    oSpreadsheet
                        .build()

                        .then(
                            function () {

                                sap.m.MessageToast.show(
                                    "Excel generado correctamente."
                                );
                            }
                        )

                        .catch(
                            function () {

                                sap.m.MessageBox.error(
                                    "No fue posible generar el archivo Excel."
                                );
                            }
                        )

                        .finally(
                            function () {

                                oSpreadsheet.destroy();
                            }
                        );
                }
            );
        }
    }
);