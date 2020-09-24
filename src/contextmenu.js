function getOptions() {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get({
            basePath: '',
            insidersBuild: false,
            debug: false,
        }, (options) => {
            if (options.basePath === '') {
                reject(new Error('Set options in the options page for this extension.'));
                return;
            }

            resolve(options);
        });
    });
}

function getVscodeLink({
    repo, file, line,
}) {
    return getOptions()
        .then(({ insidersBuild, basePath, debug }) => {
            let vscodeLink = insidersBuild
                ? 'vscode-insiders'
                : 'vscode';

            vscodeLink += '://file';

            // windows paths don't start with slash
            if (basePath[0] !== '/') {
                vscodeLink += '/';
            }

            vscodeLink += `${basePath}/${repo}/${file}`;

            // opening a folder and not a file

            if (line) {
                vscodeLink += `:${line}:1`;
            }

            if (debug) {
                alert(`About to open link: ${vscodeLink}`);
            }

            return vscodeLink;
        });
}

function parseLink(linkUrl) {
    return new Promise((resolve, reject) => {
        const pathRegexpWithLinePR = /\.org\/.+?\/(.+?)\/.+#chg_(.+)(_newline|_oldline)(.+)/;
        const pathRegexpWithLine = /\.org\/.+?\/(.+?)src\/.+?\/(.+)#lines-()(.+)/;
        const pathRegexp = /\.org\/.+?\/(.+?)src\/.+?\/(.+)/;
        var pathInfo;
        var line;
        if (!pathRegexpWithLinePR.test(linkUrl)) {
            if (!pathRegexpWithLine.test(linkUrl))
            {
                if (!pathRegexp.test(linkUrl))
                {
                reject(new Error(`Invalid link. Could not extract info from: ${linkUrl}.`));
                return;
                }
                else
                {
                    pathInfo = pathRegexp.exec(linkUrl);
                    pathInfo.push(1);
                }
            }
            else
            {
                pathInfo = pathRegexpWithLine.exec(linkUrl);
            }
        }
        else
        {
           pathInfo = pathRegexpWithLinePR.exec(linkUrl);
        }

        const repo = pathInfo[1];
        const file = pathInfo[2];
        line = pathInfo[4];

        resolve({
            repo,
            file,
            line,
        });
    });
}

function openInVscode({ linkUrl }) {
    parseLink(linkUrl)
        .then(getVscodeLink)
        .then(window.open)
        .catch(alert);
}

chrome.contextMenus.create({
    title: 'Open in VSCode',
    contexts: ['link'],
    onclick: openInVscode,
});
