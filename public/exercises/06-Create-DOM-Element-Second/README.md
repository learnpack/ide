# `06` Create DOM Element (2)

In the last exercise, we saw how to create an HTML DOM element using the `createElement()` and `appendChild()` functions. There is another way to add an element to the HTML of the website: `innerHTML`.

The `innerHTML` property is used to SET the HMTL content inside of any current DOM element. For example, if we want to add a new `<h1>` element to the website `<body>` we can do:

```js
document.body.innerHTML = "<h1>Hello World</h1>";
```

## 📝 Instructions:

1. Insert an image with the source "https://via.placeholder.com/350x150" into the `<body>`.

## 💡 Hint:

+ Here is the documentation for the `innerHTML` property: http://www.w3schools.com/jsref/prop_html_innerhtml.asp
