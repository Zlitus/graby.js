var exports = module.exports = {};

exports.hosts = {
	'www.lemonde.fr': {
		exampleUrl: 'http://www.lemonde.fr/police-justice/article/2018/03/23/prise-d-otages-dans-un-supermarche-de-l-aude_5275306_1653578.html',
		readability: true,
		selectors: ['.lire'],
		auth: {
			maxTries: 1,
			data: {
				username: 'XXX',
				password: 'XXX',
				loginUrl: 'https://secure.lemonde.fr/sfuser/connexion'
			},
			check: async function(page) {
				try {
					await page.waitForSelector('.menu-compte-inscrit', {visible: true, timeout: 3000});
					return true;
				} catch(e) {
					return false;
				}
			},
			login: async function(data, page) {
				await page.goto(data.loginUrl, {waitUntil: 'networkidle2'});
				await page.waitForSelector('form[name="connection"] input[type="email"]', {visible: true});
				await page.evaluate(function(userdata) {
					var form = document.querySelector('form[name="connection"]');
					form.querySelector('input[type="email"]').value = userdata.username;
					form.querySelector('input[type="password"]').value = userdata.password;
					form.submit();
				}, data);
			}
		},
		page: function customParse(doc) {
			/* Removing all “fakes seo-links” of lemonde.fr */
			doc.querySelectorAll('.lien_interne').forEach(function(link) {
				link.outerHTML = link.innerHTML;
			});

			/* Retrieving the author and add it to the extra-information of the Graby.js JSON */
			var author = doc.querySelector('[itemprop="author"]');
			if (author) {
				return {author: author.innerText};
			}
		}
	},
	'www.macg.co': {
		page: function customParse(doc) {
			return {date: new Date(doc.querySelector('time[class="node-time"]').getAttribute('datetime')).getTime()};
		}
	},
	'www.lesnumeriques.com': {
		selectors: {
			remove: ['#articles-related-authors']
		}
	}
};
