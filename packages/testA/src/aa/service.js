/*
 * @Description: Description
 * @Author: BeiJia
 * @Date: 2021-11-23 13:43:46
 */
import request from '@/utils/request';

// 查询短信模板列表
export const listTemp = (params) => request.get('/api/robin/sms/template', params);

// 新增短信模板
export const addTemp = (params) => request.post('/api/robin/sms/template', params);

// 根据id修改短信模板
export const updateTemp = (id, params) => request.post(`/api/robin/sms/template/${id}`, params);

// 用户状态修改
export const enableTemp = (id, params) => request.post(`/api/robin/sms/template/enabled/${id}`, params);

// 根据id列表删除用户
export const delTemp = (id) => request.post(`/api/robin/sms/template/del/${id}`);

// 获取关键词列表
export const getKeyword = () => request.get('/api/robin/sms/template/keyword');

// 获取公司列表
export const getCompanyList = () => request.get('/api/robin/company-config/company/list');

// 查询签名
export const getSignature = (params) => request.get('/api/robin/sms/template/signature', params);
