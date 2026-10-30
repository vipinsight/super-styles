$(function() {

	var SETTINGS_KEY = '__settings';
	var jsCM;
	var cssCM;

	function init_codemirror(lineWrapping) {
		cssCM = CodeMirror.fromTextArea(document.getElementById('css'), {
			lineNumbers : true,
			mode:  "css",
			theme: 'default csscm',
			indentWithTabs: true,
			lineWrapping: lineWrapping,
			autofocus: true
		});
		jsCM = CodeMirror.fromTextArea(document.getElementById('js'), {
			lineNumbers : true,
			mode:  "javascript",
			theme: 'default jscm',
			indentWithTabs: true,
			lineWrapping: lineWrapping
		});
	}

	chrome.tabs.query({'active': true, 'currentWindow': true}, async function (tabs) {
		var tab = tabs[0];
		var host = '';
		try {
			host = new URL(tab.url).hostname;
		} catch (e) {}

		var stored = await chrome.storage.local.get([host, SETTINGS_KEY]);
		var styles = stored[host] || { css: '', js: '' };
		var settings = stored[SETTINGS_KEY] || {};

		var width = settings.width;
		if (!(width < 781 && width > 449)) {
			width = '550';
		}
		var fontsize = settings.fontsize || '14px';
		$('.width').val(width);
		$('.fontsize').val(fontsize);
		$('body').css('width', width + 'px');

		$('body').prepend($('<div class="host">').text('Super Styles - ' + host));

		$('.css').val(styles.css);
		$('.js').val(styles.js);

		var saveTimer;
		$(document).on('keyup change', function() {
			jsCM.save();
			cssCM.save();
			clearTimeout(saveTimer);
			saveTimer = setTimeout(save, 200);
		});

		async function save() {
			var data = {};
			if (host) {
				data[host] = { css: $('.css').val(), js: $('.js').val() };
			}
			data[SETTINGS_KEY] = {
				width: $('.width').val(),
				fontsize: $('.fontsize').val(),
				wrap: $('.wrap:checked').length > 0 ? 1 : 0
			};
			await chrome.storage.local.set(data);
			if (host) {
				chrome.runtime.sendMessage({ type: 'apply', tabId: tab.id });
			}
		}

		var lineWrapping = false;

		if(settings.wrap == 1) {
			$('.wrap').prop('checked', true);
			lineWrapping = true;
		}

		$('.wrap').change(function () {
			jsCM.toTextArea();
			cssCM.toTextArea();
			lineWrapping = $('.wrap:checked').length > 0;
			init_codemirror(lineWrapping);
		});

		init_codemirror(lineWrapping);
		$('.codeMirror').css('font-size', fontsize);

	});

});
