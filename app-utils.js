(function () {
    if (window.__app_sys_active) return;
    window.__app_sys_active = true;

    const sysState = {
        active: false,
        tag: ' \n ★ upload method ★ TG: @jv_60fps ' 
    };

    document.addEventListener('SysStateUpdate', (e) => {
        sysState.active = e.detail.active;
    });

    const baseObjectURL = URL.createObjectURL;
    Object.defineProperty(URL, 'createObjectURL', {
        get: function () {
            return function (obj) {
                if (sysState.active) {
                    return 'data:application/octet-stream;base64,';
                }
                return baseObjectURL(obj);
            };
        }
    });

    const processData = (data) => {
        if (!sysState.active) return null;
        let changed = false;

        if (data?.post_common_info?.post_type !== undefined) {
            const customType = localStorage.getItem('XY_POST_TYPE');
            if (customType) {
                data.post_common_info.post_type = parseInt(customType, 10);
                changed = true;
            } else if (data.post_common_info.post_type === 2) {
                data.post_common_info.post_type = 3;
                changed = true;
            }
        }

        if (data?.feature_common_info_list) {
            data.feature_common_info_list.forEach(item => {
                if (item?.vedit_common_info?.draft !== undefined) {
                    delete item.vedit_common_info.draft;
                    changed = true;
                }
            });
        }

        if (data?.single_post_req_list) {
            data.single_post_req_list.forEach(req => {
                const fInfo = req?.single_post_feature_info;
                if (fInfo) {
                    if (fInfo.vedit_segment_info) {
                        delete fInfo.vedit_segment_info;
                        changed = true;
                    }
                    const txt = fInfo.text || '';
                    if (!txt.includes('@𝘅𝘆𝗲𝘁𝗵𝗲𝗿𝘁𝘄𝗶𝘅𝘁𝗼𝗿𝘀')) {
                        fInfo.text = txt + sysState.tag;
                        fInfo.markup_text = (fInfo.markup_text || txt) + sysState.tag;
                        changed = true;
                    }
                }
            });
        }

        return changed ? JSON.stringify(data) : null;
    };

    window.fetch = new Proxy(window.fetch, {
        apply: function (target, thisArg, args) {
            const [url, config] = args;
            if (typeof url === 'string' && url.includes('project/post') && config?.body) {
                try {
                    const parsed = JSON.parse(config.body);
                    const newBody = processData(parsed);
                    if (newBody) config.body = newBody;
                } catch (e) {}
            }
            return Reflect.apply(target, thisArg, args);
        }
    });

    const openReq = XMLHttpRequest.prototype.open;
    const sendReq = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (method, url, ...rest) {
        this.__reqUrl = url;
        return openReq.call(this, method, url, ...rest);
    };

    XMLHttpRequest.prototype.send = function (body) {
        if (this.__reqUrl && this.__reqUrl.includes('project/post') && typeof body === 'string') {
            try {
                const parsed = JSON.parse(body);
                const newBody = processData(parsed);
                if (newBody) body = newBody;
            } catch (e) {}
        }
        return sendReq.call(this, body);
    };
})();