/*
 * @Description: Description
 * @Author: BeiJia
 * @Date: 2021-10-15 10:54:42
 */
import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { message, Tag, Space } from 'antd';
import { ModalForm } from '@dsyd/com';
import MarkEdit from '@dsyx/mark-textarea';
import { emptyRule, nameRule } from '@/utils/verify';
import { addTemp, updateTemp, getKeyword } from './service';
import styles from './index.less';
import { cloneDeep } from 'lodash';
// import MarkEdit from './components/MarkEdit';

const EditModal = ({ refreshTable, optProject, companyOpts, tempTypeOpts }, ref) => {
  const [visible, setVisible] = useState(false);
  const [keywords, setKeywords] = useState([]);
  const [lightWords, setLightWords] = useState([]);
  const [tempType, setTempType] = useState();
  const [curCompanyOpts, setCurCompanyOpts] = useState([]); // 下拉用的公司下拉列表
  const [mode, setMode] = useState('add'); // 弹窗模式 'add' 'update' 'view'
  const formRef = useRef();
  const mdRef = useRef();

  const titleMap = {
    add: '新增短信模板',
    update: '修改短信模板',
    view: '短信模板详情'
  };

  const signatures = [
    { keyword: '大熵数科', dataColumn: 'dssk', explain: '大熵数科签名' },
    { keyword: '调解组织', dataColumn: 'tjzz', explain: '调解组织签名' }
  ];

  // 取消按钮，重置表单
  const afterClose = () => {
    setTempType(null);
    formRef.current?.resetFields();
  };

  // 更新请求
  const handleOk = async (form) => {
    let params = cloneDeep(form);
    const { id, content, companyIds, projectId } = params;
    params.projectId = (projectId || [])?.join();
    // 校验并指定签名
    if (content?.startsWith('【大熵数科】')) {
      params.signature = '【大熵数科】';
    } else if (content?.startsWith('【${调解组织}】')) {
      params.signature = '【${调解组织}】';
    } else {
      return message.warning('短信签名不能为空');
    }

    // 校验内容
    if (content === '【大熵数科】' || content === '【${调解组织}】') {
      return message.warning('短信内容不能为空');
    }
    if (companyIds && companyIds?.length) {
      params.companyIds = companyIds.join(',');
      params.employRange = curCompanyOpts.filter(({value}) => companyIds?.includes(value))
        ?.map(({label}) => label)
        ?.join(',');
    }
    const updateParams = {
      content: params.content,
      signature: params.signature,
      employRange: params.employRange,
      companyIds: params.companyIds,
      projectId: params.projectId
    };
    const { success } = await (id ? updateTemp(id, updateParams) : addTemp(params));
    if (success) {
      message.success('操作成功');
      setVisible(false);
      refreshTable();
    }
  };

  useImperativeHandle(ref, () => ({
    open: (mode, _params = {}) => {
      setVisible(true);
      setMode(mode);
      let params = cloneDeep(_params);
      if (mode !== 'add') {
        params.content = `${params?.signature}${params?.content}`;
        params.companyIds = params?.companyIds?.split(',');
        params.employRange = params?.employRange?.split(',');
        params.projectId = params?.projectId?.split(',');
        setTempType(params?.type);
        if (formRef.current) {
          formRef.current.setFieldsValue(params);
        } else {
          // 第一次打开，等待表单渲染完成之后在赋值
          setTimeout(() => {
            formRef.current?.setFieldsValue(params);
          }, 300);
        }
      }
    }
  }));

  // 点击签名
  const signatureClick = (e, item) => {
    const value = formRef.current?.getFieldValue('content');
    if (value?.startsWith('【大熵数科】') || value?.startsWith('【${调解组织}】')) {
      message.warning('已有签名，如需覆盖请删除后重新添加');
      return;
    }
    const signatureStr = `【${item.keyword === '调解组织' ? '${调解组织}' : '大熵数科'}】`;
    formRef.current?.setFieldsValue({content: signatureStr + (value || '')});
  };

  const tagClick = (e, item) => {
    const str = '${' + item.keyword + '}'; // 插入指标-${cstName}
    mdRef.current?.insertToCursor(str);
  };

  const tagsDom = () => {
    const dom = (
      <>
        <div className='tags-row mb15'>
          <span className='tr-label'>签名:</span>
          <Space wrap className='tr-content' >
            {signatures.map((item) => (
              <Tag
                key={item.dataColumn}
                className={styles.customTag}
                onClick={(e) => signatureClick(e, item)}
              >
                {item.keyword}
              </Tag>
            ))}
          </Space>
        </div>
        <div className='tags-row'>
          <span className='tr-label'>内容:</span>
          <Space wrap className='tr-content'>
            {keywords.map((item) => (
              <Tag
                key={item.dataColumn}
                className={styles.customTag}
                onClick={(e) => tagClick(e, item)}
              >
                {item.keyword}
              </Tag>
            ))}
          </Space>
        </div>
      </>
    );
    return dom;
  };

  const column = [
    {
      title: 'id',
      dataIndex: 'id',
      column: 0
    },
    {
      label: '项目名称',
      name: 'projectId',
      type: 'select',
      props: {
        showSearch: true, // 可搜索
        showArrow: true,
        mode: 'multiple',
        maxTagCount: 'responsive',
        optionFilterProp: 'children' // 搜索依赖key
      },
      optionsData: optProject,
      validOptions: {
        rules: emptyRule
      }
    },
    {
      label: '模板名称',
      name: 'name',
      type: 'input',
      props: {
        disabled: mode !== 'add'
      },
      validOptions: {
        rules: nameRule
      }
    },
    {
      label: '模板类型',
      name: 'type',
      type: 'select',
      optionsData: tempTypeOpts,
      props: {
        disabled: mode !== 'add',
        onChange: (v) => {
          setTempType(v);
          formRef.current.setFieldsValue({companyIds: []});
        }
      },
      validOptions: {
        rules: emptyRule
      }
    },
    {
      label: '适用范围',
      name: 'companyIds',
      type: 'select',
      hideInForm: ![1, 2].includes(tempType),
      optionsData: curCompanyOpts,
      props: {
        disabled: !['add', 'update'].includes(mode),
        mode: 'multiple',
        showArrow: true, // 显示下拉小箭头
        maxTagCount: 'responsive',
        onChange: (v) => {
          const value = v || [];
          if (v?.length > 1 && v[0] === '0') { // 先选通用
            formRef.current.setFieldsValue({companyIds: value.filter(i => i !== '0')});
          } else if (v?.length > 1 && v[v?.length - 1] === '0') { // 后选通用
            formRef.current.setFieldsValue({companyIds: ['0']});
          }
        }
      },
      validOptions: {
        rules: emptyRule
      }
    },
    {
      label: '模板内容',
      name: 'content',
      type: 'custom',
      defaultValue: '',
      renderChild: (
        <MarkEdit
          ref={mdRef}
          preClassName='mstPre'
          textareaId='mstTextarea'
          rows={8}
          placeholder='请输入，不超过1000字'
          searchWords={lightWords}
          disabled={mode === 'view'}
        />
      ),
      validOptions: {
        rules: [
          ...emptyRule
        ]
      }
    },
    {
      type: 'custom',
      column: mode === 'view' ? 0 : 1,
      renderChild: tagsDom()
    }
  ];

  // 监听模板类型，动态改变适用范围下拉
  useEffect(() => {
    if (tempType) {
      const objMap = {
        1: '处置方',
        2: '调解方'
      };
      const opt = companyOpts.filter(i => (i.type === objMap[tempType] || i.type === 'common'));
      setCurCompanyOpts(opt);
    } else {
      setCurCompanyOpts([]);
    }
  }, [tempType]);

  useEffect(() => {
    // 获取关键字列表
    getKeyword().then(({ success, data }) => {
      setKeywords(success ? data : []); // 选取内容列表
      // 显示高亮列表
      const lightMap = [
        ...signatures,
        ...(success ? data : [])
      ];
      setLightWords((lightMap || []).map(item => '${' + item.keyword + '}'));
    });
  }, []);

  return (
    <ModalForm
      className={styles.msgTempModal}
      width={600}
      formProps={{ autoComplete: 'off', labelWidth: 100 }}
      formRef={formRef}
      visible={visible}
      title={titleMap[mode]}
      formSet={column} // 表单配置
      okButtonProps={{ disabled: mode === 'view' }}
      afterClose={afterClose}
      onOk={handleOk}
      onCancel={() => setVisible(false)}
    />
  );
};

export default forwardRef(EditModal);
