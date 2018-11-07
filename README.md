# graby.js
Graby extract article content from web pages, using puppeteer (Chrome Headless). Inspired by [j0ck3r/graby](https://github.com/j0k3r/graby).

## How it’s work?
Graby.js is originally build to retrieve articles from blog or news websites. Basically, you can just launch:
```bash
node graby https://www.theverge.com/2018/11/7/18069178/end-robocalls-lawsuits-do-not-call-registry-ftc
```

And Graby will return you a JSON with theses information:
  - `name`: The article title
  - `date`: A milliseconds timestamp of the publication date of the article
  - `content`: HTML content of the article

Example:
```json
{
  "name": "Why robocalls have taken over your phone",
  "date": 1541599224000,
  "cover": [
    {
      "@type": "ImageObject",
      "url": "https://cdn.vox-cdn.com/thumbor/i6f-E9vaS-X_-4KzKniiaSyX39c=/1400x1400/filters:format(jpeg)/cdn.vox-cdn.com/uploads/chorus_asset/file/10357163/DSCF2964.jpg",
      "width": 1400,
      "height": 1400
    }
  ],
  "content": "<p id=\"44skvi\">By 2009, Chris Hughson was fed up. The Portland area realtor was getting bombarded with spam texts and calls…"
}
```

To do that, Graby.us use a forked version of [mozilla/readability](https://github.com/mozilla/readability) and if it's needed, you can retrieve some specific information or fix a bad automatic detection by making a **Siteconfig**.

*Graby.js* can retrieve some articles behind an authentification, or paywall, you just have to specify the credentials and the method of authentication in a **Siteconfig**.

## Using Graby.js in another script
You can easily import Graby.js and use it in any other Node.js application, here a simple example:
```js
const graby = require('./graby.js');

(async() => {
	var data = await graby({url: 'https://www.theverge.com/2018/11/7/18069178/end-robocalls-lawsuits-do-not-call-registry-ftc'});
	console.log(data);
	/*
		{
			"name": "Why robocalls have taken over your phone",
			"date": 1541599224000,
			…
		}
	*/
});
```

## Making a Siteconfig
If a website is not well supported by Graby, or if you want add extra-information to the returned JSON, you can build a Siteconfig for a custom website. Siteconfigs are JS objects supporting theses attributes:

- `auth`
    - `maxTries`: If authentication failed, how many max try of reconnection?
    - `data`: Generally, credentials. Theses information are passed in first parameter of `login()`.
    - `check`: Pass a function callback to check if the page is currently authentificated or not. First parameter is the puppeteer page.
    - `login`: Pass a function to do the authentication work. First parameter of the function is the information passed in `data`, second parameter is the puppeteer page.
- `page`: Pass a function to do some actions on the page (remove some elements, extract some information). First parameter is the puppeteer page. You can return an object wich will be merged with the JSON returned at the end by Graby (You can use that to retrieve some extra-information like the author of an article or this kind of things).
- `selectors`: Array of CSS selectors to search and remove from the original document.

Example:
```js
{
	'www.lemonde.fr': {
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

			/* Removing all “see-more” of lemonde.fr */
			doc.querySelectorAll('.lire').forEach(function(el) {
				el.remove();
			});

			/* Retrieving the author and add it to the extra-information of the Graby.js JSON */
			var author = doc.querySelector('[itemprop="author"]');
			if (author) {
				return {author: author.innerText};
			}
		}
	}
}
```
