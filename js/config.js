define(['optional!config-local'], function (localConfig) {
	var config = {};
	if (JSON.stringify(localConfig) == JSON.stringify({})) {
		console.warn(`Local configuration not found.  Using default values. To use a local configuration and suppress 404 errors, create a file called config-local.js under the /js directory`);
	}

	// default configuration
	config.api = {
		name: 'Local',
		url: 'http://localhost:8080/WebAPI/'
	};
	config.cohortComparisonResultsEnabled = false;
	config.userAuthenticationEnabled = false;
	config.plpResultsEnabled = false;

	// JupyterHub
	config.jupyterhub = {
		enabled: false,
		url: '',
		subFolder: ''
    };

	Object.assign(config, localConfig);
	config.webAPIRoot = config.api.url;
    config.jupyterhub.absoluteWorkDirectory = [config.jupyterhub.url,'user', config.jupyterhub.user, 'tree', config.jupyterhub.subFolder].join('/');
	return config;
});
