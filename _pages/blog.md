---
layout: archive
title: "Blog"
permalink: /blog/
author_profile: true
---

<small>What I’ve Been Reading</small>

---

{% assign articles = site.blog | sort: "date" | reverse %}
{% for article in articles %}
**[{{ article.title }}]({{ article.url | relative_url }})**

{{ article.date | date: "%b %-d, %Y" }}

{{ article.description }}

{% endfor %}
