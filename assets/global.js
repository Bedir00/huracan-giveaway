document.addEventListener('DOMContentLoaded', function () {
  initMobileNav();
  initProductGallery();
  initCartQuantityInputs();
  initVariantPicker();
});

function formatMoney(cents, format) {
  format = format || window.themeMoneyFormat || '€{{amount}}';
  var value = '';
  var placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
  var match = format.match(placeholderRegex);

  function defaultTo(a, b) { return a == null ? b : a; }

  function formatWithDelimiters(number, precision, thousands, decimal) {
    precision = defaultTo(precision, 2);
    thousands = defaultTo(thousands, '.');
    decimal = defaultTo(decimal, ',');
    if (isNaN(number) || number == null) return 0;

    number = (number / 100.0).toFixed(precision);
    var parts = number.split('.');
    var dollars = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands);
    var cents2 = parts[1] ? decimal + parts[1] : '';
    return dollars + cents2;
  }

  if (!match) return format;
  var kind = match[1];
  switch (kind) {
    case 'amount':
      value = formatWithDelimiters(cents, 2);
      break;
    case 'amount_no_decimals':
      value = formatWithDelimiters(cents, 0);
      break;
    case 'amount_with_comma_separator':
      value = formatWithDelimiters(cents, 2, '.', ',');
      break;
    case 'amount_no_decimals_with_comma_separator':
      value = formatWithDelimiters(cents, 0, '.', ',');
      break;
    default:
      value = formatWithDelimiters(cents, 2);
  }

  return format.replace(placeholderRegex, value);
}

function initVariantPicker() {
  var section = document.querySelector('[data-product-form]');
  if (!section) return;

  var variantDataEl = section.querySelector('[data-product-variants]');
  if (!variantDataEl) return;

  var variants = JSON.parse(variantDataEl.textContent);
  var selects = section.querySelectorAll('.product-form__variant-select');
  var sectionId = section.getAttribute('data-section-id');
  var variantIdInput = document.getElementById('ProductVariantId-' + sectionId);
  var priceWrap = document.getElementById('ProductPrice-' + sectionId);
  var availability = document.getElementById('ProductAvailability-' + sectionId);
  var addButton = document.getElementById('AddToCartButton-' + sectionId);
  var mainImage = section.querySelector('.product__media-main img');

  if (!selects.length) return;

  function findMatchingVariant() {
    var selected = Array.prototype.map.call(selects, function (select) {
      return select.value;
    });

    return variants.find(function (variant) {
      var options = [variant.option1, variant.option2, variant.option3].filter(function (o) {
        return o !== null && o !== undefined;
      });
      return options.every(function (option, index) {
        return option === selected[index];
      });
    });
  }

  function updateForVariant(variant) {
    if (!variant) return;

    if (variantIdInput) variantIdInput.value = variant.id;

    if (priceWrap) {
      var onSale = variant.compare_at_price && variant.compare_at_price > variant.price;
      priceWrap.innerHTML = onSale
        ? '<div class="price price--on-sale">' +
          '<span class="price__sale">' + formatMoney(variant.price) + '</span>' +
          '<s class="price__compare">' + formatMoney(variant.compare_at_price) + '</s>' +
          '</div>'
        : '<div class="price"><span class="price__regular">' + formatMoney(variant.price) + '</span></div>';
    }

    if (availability) {
      if (variant.available) {
        availability.textContent = '';
        availability.classList.remove('product__availability--sold-out');
      } else {
        availability.textContent = addButton ? addButton.getAttribute('data-label-soldout') : '';
        availability.classList.add('product__availability--sold-out');
      }
    }

    if (addButton) {
      addButton.disabled = !variant.available;
      addButton.textContent = variant.available
        ? addButton.getAttribute('data-label-add')
        : addButton.getAttribute('data-label-soldout');
    }

    if (mainImage && variant.featured_image && variant.featured_image.src) {
      mainImage.src = variant.featured_image.src;
    }
  }

  selects.forEach(function (select) {
    select.addEventListener('change', function () {
      var variant = findMatchingVariant();
      updateForVariant(variant);
    });
  });
}

function initMobileNav() {
  var toggle = document.getElementById('MobileNavToggle');
  var nav = document.getElementById('MobileNav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', function () {
    var isOpen = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', isOpen);
  });
}

function initProductGallery() {
  var thumbs = document.querySelectorAll('.product__media-thumb');
  if (!thumbs.length) return;

  thumbs.forEach(function (thumb) {
    thumb.addEventListener('click', function () {
      var mainImage = thumb.closest('.product__media').querySelector('.product__media-main img');
      var fullSrc = thumb.getAttribute('data-full-image');
      if (mainImage && fullSrc) {
        mainImage.src = fullSrc;
      }
      thumbs.forEach(function (t) { t.classList.remove('is-active'); });
      thumb.classList.add('is-active');
    });
  });
}

function initCartQuantityInputs() {
  var inputs = document.querySelectorAll('[data-cart-quantity-input]');
  if (!inputs.length) return;

  inputs.forEach(function (input) {
    input.addEventListener('change', function () {
      var key = input.getAttribute('data-key');
      var quantity = parseInt(input.value, 10);
      if (isNaN(quantity) || quantity < 0) return;

      fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: key, quantity: quantity })
      })
        .then(function (response) { return response.json(); })
        .then(function (cart) {
          var countEls = document.querySelectorAll('[data-cart-count]');
          countEls.forEach(function (el) { el.textContent = cart.item_count; });
          window.location.reload();
        })
        .catch(function (error) {
          console.error('Warenkorb konnte nicht aktualisiert werden:', error);
        });
    });
  });
}
