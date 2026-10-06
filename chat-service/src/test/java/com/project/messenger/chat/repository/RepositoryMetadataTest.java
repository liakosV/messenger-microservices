package com.project.messenger.chat.repository;

import org.junit.jupiter.api.Test;
import org.springframework.data.jpa.repository.support.JpaRepositoryFactory;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.assertNotNull;

/** Builds the real ORM metadata and parses repository JPQL without opening a database connection. */
class RepositoryMetadataTest {
    @Test
    void entityMappingsAndRepositoryQueriesBootstrapWithoutDatabase() {
        var factory = new LocalContainerEntityManagerFactoryBean();
        factory.setPackagesToScan("com.project.messenger.chat.model");
        factory.setJpaVendorAdapter(new HibernateJpaVendorAdapter());
        factory.setJpaPropertyMap(Map.of("hibernate.boot.allow_jdbc_metadata_access", false,
                "hibernate.dialect", "org.hibernate.dialect.MySQLDialect", "hibernate.hbm2ddl.auto", "none"));
        factory.afterPropertiesSet();
        try (var entityManager = factory.getObject().createEntityManager()) {
            var repositories = new JpaRepositoryFactory(entityManager);
            assertNotNull(repositories.getRepository(ConversationRepository.class));
            assertNotNull(repositories.getRepository(MessageRepository.class));
        } finally { factory.destroy(); }
    }
}
