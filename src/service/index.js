import {
	AppStoreMethodsApi,
	ComposeMethodsApiFactory,
	Configuration,
	InternalMethodsApiFactory,
} from '@/openapi/app_management'
import { instance } from '@/service/service'
// app_management

// 初始化 openapi 配置
const config = new Configuration({})

const appManagement = {}
appManagement.compose = new ComposeMethodsApiFactory(config, '/v2/app_management', instance)
// appManagement.appStore = new AppStoreMethodsApiFactory(config, '/v2/app_management', instance);
appManagement.appStore = new AppStoreMethodsApi(config, '/v2/app_management', instance)
const appGrid = new InternalMethodsApiFactory(config, '/v2/app_management', instance)
const appCompose = new ComposeMethodsApiFactory(config, '/v2/app_management', instance)

// apiClient.axios = instance;
export default { appManagement, appGrid, appCompose }
