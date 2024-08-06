export const Request = (vm) => {
	uni.$uv.http.setConfig((config) => {
		config.baseURL = "https://api.50andolder.com/api/";
		return config;
	});
	uni.$uv.http.interceptors.request.use(
		(config) => {
			config.data = config.data || {};
			if (config?.custom?.auth) {
				config.header.token = "123456";
			}
			return config;
		},
		(config) => {
			return Promise.reject(config);
		},
	);

	// 响应拦截
	uni.$uv.http.interceptors.response.use(
		(response) => {
			const data = response.data
			// 自定义参数
			const custom = response.config?.custom;
			if (data.code !== 200) {
				if (custom.toast !== false) {
					uni.$uv.toast(data.msg)
				}
				if (custom?.catch) {
					return Promise.reject(data)
				} else {
					return new Promise(() => {})
				}
			}
			return data === undefined ? {} : data
		},
		(response) => {
			return Promise.reject(response);
		},
	);
};