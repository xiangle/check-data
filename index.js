'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var toDate = _interopDefault(require('validator/lib/toDate'));
var isMongoId = _interopDefault(require('validator/lib/isMongoId'));
var isMobilePhone = _interopDefault(require('validator/lib/isMobilePhone'));
var isEmail = _interopDefault(require('validator/lib/isEmail'));

var symbols = {
   mongoId: Symbol('mongoId'),
   mobilePhone: Symbol('mobilePhone'),
   email: Symbol('email'),
};

/**
 * 通用验证方法
 */

var common = {
   // 参数自定义转换方法
   set(data, func, origin) {
      return { data: func.call(origin, data) }
   },
   // 直接赋值（覆盖原来的值）
   value(undefined$1, data) {
      return { data }
   },
   // 与
   and(data, option, origin) {
      // option为函数时先执行函数，将函数转为数组表达式
      if (option instanceof Function) {
         option = option.call(origin, data);
      }
      // 数组表达式
      if (option instanceof Array) {
         for (let name of option) {
            if (origin[name] === undefined || origin[name] === '') {
               return { error: `必须与${name}参数同时存在` }
            }
         }
      }
      return { data }
   },
   // 或
   or(data, option, origin) {
      // 如果option为函数，应先执行函数，将函数转为数组
      if (option instanceof Function) {
         option = option.call(origin, data);
      }
      if (option instanceof Array) {
         let status = true;
         for (let name of option) {
            if (origin[name] !== undefined && origin[name] !== '') {
               status = false;
            }
         }
         if (status) {
            return { error: `必须至少与[${option}]参数中的一个同时存在` }
         }
      }
      return { data }
   },
};

// 数据类型验证方法
var Types = {
   [String]: {
      ...common,
      // 数据类型验证
      type(data) {
         if (typeof data === 'string') {
            return { data: data.trim() }
         } else {
            return { error: '必须为String类型' }
         }
      },
      // 限制最小长度
      min(data, min) {
         if (data.length < min) {
            return { error: `长度不能小于${min}个字符` }
         } else {
            return { data }
         }
      },
      // 限制最大长度
      max(data, max) {
         if (data.length > max) {
            return { error: `长度不能大于${max}个字符` }
         } else {
            return { data }
         }
      },
      // 正则
      reg(data, reg) {
         if (data.search(reg) === -1) {
            return { error: '格式错误' }
         } else {
            return { data }
         }
      },
      // 包含
      in(data, array) {
         let result = array.indexOf(data);
         if (result === -1) {
            return { error: `值必须为[${array}]选项其中之一` }
         } else {
            return { data }
         }
      },
   },
   [Number]: {
      ...common,
      type(data) {
         if (isNaN(data)) {
            return { error: '必须为Number类型' }
         } else {
            return { data: Number(data) }
         }
      },
      min(data, min) {
         if (data < min) {
            return { error: `不能小于${min}` }
         } else {
            return { data }
         }
      },
      max(data, max) {
         if (data > max) {
            return { error: `不能大于${max}` }
         } else {
            return { data }
         }
      },
      // 包含
      in(data, array) {
         let result = array.indexOf(data);
         if (result === -1) {
            return { error: `值必须为${array}中的一个` }
         } else {
            return { data }
         }
      }
   },
   [Array]: {
      ...common,
      type(data) {
         if (Array.isArray(data)) {
            return { data }
         } else {
            return { error: '必须为Array类型' }
         }
      },
      min(data, min) {
         if (data.length < min) {
            return { error: `长度不能小于${min}个字符` }
         } else {
            return { data }
         }
      },
      max(data, max) {
         if (data.length > max) {
            return { error: `长度不能大于${max}个字符` }
         } else {
            return { data }
         }
      },
   },
   [Object]: {
      ...common,
      type(data) {
         if (typeof data === 'object') {
            return { data }
         } else {
            return { error: '必须为Object类型' }
         }
      },
   },
   [Boolean]: {
      ...common,
      type(data) {
         if (typeof data === 'boolean') {
            return { data }
         } else {
            return { error: '必须为Boolean类型' }
         }
      },
   },
   [Date]: {
      ...common,
      type(data) {
         if (toDate(data + '')) {
            return { data }
         } else {
            return { error: '必须为Date类型' }
         }
      },
   },
   [Function]: {
      ...common,
      type(data) {
         if (typeof data === 'function') {
            return { data }
         } else {
            return { error: '必须为Function类型' }
         }
      },
   },
   [symbols.mongoId]: {
      ...common,
      type(data) {
         if (isMongoId(String(data))) {
            return { data }
         } else {
            return { error: '必须为MongoId' }
         }
      },
   },
   [symbols.mobilePhone]: {
      ...common,
      type(data) {
         if (isMobilePhone(String(data), 'zh-CN')) {
            return { data }
         } else {
            return { error: '必须为手机号' }
         }
      },
   },
   [symbols.email]: {
      ...common,
      type(data) {
         if (isEmail(String(data))) {
            return { data }
         } else {
            return { error: '必须为Email格式' }
         }
      },
   },
};

const ignore = [undefined, null, ''];

class Parser {
   /**
    * 
    * @param {*} options 验证表达式
    * @param {String} mode 验证模式
    */
   constructor(options, mode) {
      this.options = options;
      this.mode = mode;
   }

   /**
    * 执行数据验证
    * @param {*} origin 待验证原始数据
    */
   run(origin) {
      this.origin = origin;
      return this.recursion(origin, this.options, '')
   }

   /**
    * 判断是否允许为空值，默认将undefined、 null、空字符串视为空值
    * 默认值在大多数场景下适用，在出现例外时，可以在指定字段上使用ignore属性，重置对默认空值的定义
    * @param {*} data 需要校验空值的数据
    */
   isNull(data, ignore) {

      if (ignore.includes(data)) {
         return true
      }

   }

   /**
    * 递归验证器
    * @param {*} data 待验证数据
    * @param {*} options 验证表达式
    * @param {String,Number} key 数据索引
    */
   recursion(data, options, key) {

      // 选项值为对象
      if (typeof options === 'object') {

         return this.object(data, options, key)

      }

      // 选项值为数据类型（值为构造函数或Symbol，Symbol表示自定义类型）
      else if (Types[options]) {

         if (this.isNull(data, ignore)) {
            // 严格模式下，禁止空值
            if (this.mode === 'strict') {
               return { error: "值不允许为空" }
            }
            return {}
         }

         let { error, data: subData } = Types[options].type(data);

         if (error) {
            return { error: `值${error}` }
         } else {
            return { data: subData }
         }

      }

      // 选项值为严格匹配的精确值类型
      else if (data === options) {

         return { data }

      }

      // 精确值匹配失败
      else {

         return { error: `值必须为${options}` }

      }

   }

   /**
    * 对象结构
    * @param {*} data 
    * @param {*} options 
    * @param {*} key 
    */
   object(data, options, key) {

      // options为验证表达式
      if (options.type) {

         return this.expression(data, options, key)

      }

      // options为数组结构
      else if (Array.isArray(options)) {

         return this.array(data, options, key)

      }

      // options为对象结构
      else {

         if (typeof data !== 'object') {
            // 宽松模式下，跳过空值
            if (this.mode === 'loose') {
               if (this.isNull(data, ignore)) return {}
            }
            return {
               error: `值必须为Object类型`
            }
         }

         let dataObj = {};

         for (const sKey in options) {

            let { error, data: subData } = this.recursion(data[sKey], options[sKey], sKey);

            if (error) {
               // 非根节点
               if (key) {
                  return {
                     error: `.${sKey}${error}`
                  }
               } else {
                  return {
                     error: `${sKey}${error}`
                  }
               }
            } else if (subData !== undefined) {
               dataObj[sKey] = subData;
            }

         }

         return { data: dataObj }

      }

   }

   /**
    * 验证表达式
    * @param {*} data 
    * @param {*} options 
    * @param {*} key 
    */
   expression(data, options, key) {

      // 空值处理
      if (this.isNull(data, options.ignore || ignore)) {

         // 默认值
         if (options.default) {
            data = options.default;
         }

         // 禁止空值
         else if (options.allowNull === false) {
            return { error: `值不允许为空` }
         }

         // 允许空值
         else if (options.allowNull === true) {
            return { data }
         }

         // 严格模式下，禁止空值
         else if (this.mode === 'strict') {
            return { error: `值不允许为空` }
         }

         else {
            return { data }
         }

      }

      const type = Types[options.type];

      // type为内置数据类型
      if (type) {

         for (let name in options) {
            let method = type[name];
            if (method) {
               let option = options[name];
               let { error, data: subData } = method(data, option, this.origin);
               if (error) {
                  return { error: `${error}` }
               }
               data = subData;
            }
         }

         return { data }

      }

      // 不支持的数据类型
      else {
         return {
            error: `${key}参数配置错误，不支持${options.type}类型`
         }
      }

   }

   /**
    * 数组结构
    * @param {*} data 
    * @param {*} options 
    * @param {*} key 
    */
   array(data, options, key) {

      if (!Array.isArray(data)) {
         // 宽松模式下，跳过空值
         if (this.mode === 'loose') {
            if (this.isNull(data, ignore)) return {}
         }
         return {
            error: `${key}必须为数组类型`
         }
      }

      let itemKey = 0;
      let dataArray = [];

      // options为单数时采用通用匹配
      if (options.length === 1) {

         let [option] = options;

         for (let itemData of data) {

            // 子集递归验证
            let { error, data: subData } = this.recursion(itemData, option, itemKey);

            if (error) {
               return {
                  error: `[${itemKey}]${error}`
               }
            } else if (subData !== undefined) {
               dataArray.push(subData);
            }

            itemKey++;

         }

      }

      // options为复数时采用精确匹配
      else {

         for (let option of options) {

            let itemData = data[itemKey];

            // 子集递归验证
            let { error, data: subData } = this.recursion(itemData, option, itemKey);

            if (error) {
               return {
                  error: `[${itemKey}]${error}`
               }
            } else if (subData !== undefined) {
               dataArray.push(subData);
            }

            itemKey++;

         }

      }

      return { data: dataArray }

   }

}

/**
 * 验证器
 * @param {*} data 数据源
 * @param {*} options 验证表达式
 * @param {Object} extend 导出数据扩展函数集合
 * @param {String} mode 验证模式（仅供内部使用）
 */
function typea(data, options, extend = {}, mode) {

   let parser = new Parser(options, mode);

   let result = parser.run(data);

   if (result.error) {
      return result
   }

   // 数据扩展函数，基于已验证的数据构建新的数据结构
   for (let name in extend) {
      let item = extend[name];
      if (typeof item === 'function') {
         item = item.call(result.data, result.data);
      }
      result.data[name] = item;
   }

   return result

}

// 严格模式
typea.strict = function (data, options, extend = {}) {

   return typea(data, options, extend, 'strict')

};

// 宽松模式
typea.loose = function (data, options, extend = {}) {

   return typea(data, options, extend, 'loose')

};

typea.types = symbols;


/**
 * 自定义数据类型扩展方法
 * @param {Function, Symbol, String} type 数据类型
 * @param {Object} options 扩展选项
 * @param {Object.Function} options 扩展方法
 */
typea.use = function (type, options = {}) {

   if (!type) return

   // 通过Symbol定位，扩展已有数据类型
   if (Types[type]) {

      Object.assign(Types[type], options);

   }

   // 通过String定位，扩展已有数据类型或创建新类型
   else if (typeof type === 'string') {

      // 扩展已有Symbol类型
      if (symbols[type]) {
         let symbol = symbols[type];
         Object.assign(Types[symbol], options);
      }

      // 创建新类型
      else {
         const symbol = Symbol(type);
         symbols[type] = symbol;
         Types[symbol] = options;
         Object.assign(Types[symbol], common);
      }

   }

};


/**
 * 通过预处理方式，将提前处理好的静态options持久化驻留在内存中
 * 避免同一个对象被多次重复的创建和销毁，实现options跨接口复用，在节省资源的同时，也增加了代码复用率
 * @param {*} options 验证表达式
 * @param {Object} extend 数据扩展选项
 */
typea.schema = function (options, extend) {

   const schema = function (data) {
      return typea(data, options, extend, undefined);
   };

   /**
    * 严格模式
    * 禁止所有空值，有值验证，无值报错
    */
   schema.strict = function (data) {
      return typea(data, options, extend, 'strict')
   };

   /**
    * 宽松模式
    * 忽略所有空值，有值验证，无值跳过，即使allowNull值为true
    */
   schema.loose = function (data) {
      return typea(data, options, extend, 'loose')
   };

   return schema

};

module.exports = typea;
