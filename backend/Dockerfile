FROM php:8.2-apache

RUN apt-get update \
    && apt-get install -y \
        git \
        unzip \
        passwd \
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

RUN usermod -a -G 1000 www-data

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY . .

COPY certs/ca.pem /etc/ssl/certs/tidb-ca.pem

RUN touch .env

RUN composer install --no-dev --optimize-autoloader --no-interaction --no-scripts

RUN mkdir -p var/cache var/log public/uploads

ENV APACHE_DOCUMENT_ROOT=/var/www/html/public

RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' \
    /etc/apache2/sites-available/000-default.conf

RUN printf '<Directory /var/www/html/public>\n\
    AllowOverride All\n\
    Require all granted\n\
</Directory>\n' > /etc/apache2/conf-available/symfony.conf \
    && a2enconf symfony

RUN chown -R www-data:www-data /var/www/html/var /var/www/html/public

EXPOSE 80

CMD ["apache2-foreground"]