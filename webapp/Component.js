jQuery.sap.declare("customer.zfin.f0708.excel.Component");

// use the load function for getting the optimized preload file if present
sap.ui.component.load({
	name: "fin.gl.finstatement.display",
	// Use the below URL to run the extended application when SAP-delivered application is deployed on SAPUI5 ABAP Repository
	url: "/sap/bc/ui5_ui5/sap/FIN_FINSTATEMNT"

	// we use a URL relative to our own component
	// extension application is deployed with customer namespace
});

fin.gl.finstatement.display.Component.extend("customer.zfin.f0708.excel.Component", {
	metadata: {
		manifest: "json"
	}	
});
