---
tutorial: "https://www.youtube.com/watch?v=FR-1STeP4Fg"
---


# `08.1` Remove DOM Element

Si deseas eliminar un elemento del DOM, debes usar la función `removeChild()`. El desafío detrás de esta función es que debe llamarse desde el padre del elemento que quieres eliminar. Por ejemplo:

```html
<ul>
    <li>First element</li>
    <li>Second element</li>
    <li>Third element</li>
</ul>
```

En el código anterior, para eliminar el segundo elemento, necesito la función `removeChild()` desde la `<ul>` padre, pasando como parámetro el `<li>` que quiero eliminar.

Algo como esto:

```js
let element = document.querySelector("#element-id");
element.parentNode.removeChild(element);
```

## 📝 Instrucciones:

1. Elimina el segundo `<li>` de la `<ul>` que forma parte del HTML de este sitio web.
