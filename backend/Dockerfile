FROM php:8.2-apache

RUN apt-get update \
    && apt-get install -y \
        git \
        unzip \
        libicu-dev \
        libzip-dev \
        libonig-dev \
    && docker-php-ext-install \
        pdo_mysql \
        intl \
        zip \
        opcache \
    && a2enmod rewrite \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY . .

# Symfony needs the .env file to exist
RUN touch .env

RUN composer install --no-dev --optimize-autoloader --no-interaction --no-scripts

RUN mkdir -p var/cache var/log public/uploads

ENV APACHE_DOCUMENT_ROOT=/var/www/html/public

RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' \
    /etc/apache2/sites-available/000-default.conf

RUN chown -R www-data:www-data /var/www/html/var /var/www/html/public

RUN touch /var/www/html/.env

EXPOSE 80

CMD ["apache2-foreground"]