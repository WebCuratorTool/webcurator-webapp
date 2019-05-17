package org.webcurator.webapp.beans.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.beans.factory.config.PropertyPlaceholderConfigurer;
import org.springframework.context.annotation.*;
import org.springframework.context.support.ResourceBundleMessageSource;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.core.io.support.ResourcePatternUtils;
import org.springframework.jndi.JndiObjectFactoryBean;
import org.springframework.orm.hibernate5.HibernateTransactionManager;
import org.springframework.orm.hibernate5.LocalSessionFactoryBean;
import org.springframework.scheduling.quartz.JobDetailBean;
import org.springframework.scheduling.quartz.MethodInvokingJobDetailFactoryBean;
import org.springframework.scheduling.quartz.SchedulerFactoryBean;
import org.springframework.scheduling.quartz.SimpleTriggerBean;
import org.springframework.transaction.support.TransactionTemplate;
import org.webcurator.auth.AuthorityManagerImpl;
import org.webcurator.core.admin.PermissionTemplateManagerImpl;
import org.webcurator.core.agency.AgencyUserManagerImpl;
import org.webcurator.core.archive.ArchiveAdapterImpl;
import org.webcurator.core.archive.SipBuilder;
import org.webcurator.core.check.BandwidthChecker;
import org.webcurator.core.check.CheckProcessor;
import org.webcurator.core.check.Checker;
import org.webcurator.core.check.CoreCheckNotifier;
import org.webcurator.core.common.EnvironmentImpl;
import org.webcurator.core.harvester.agent.HarvestAgentFactoryImpl;
import org.webcurator.core.harvester.coordinator.*;
import org.webcurator.core.notification.InTrayManagerImpl;
import org.webcurator.core.notification.MailServerImpl;
import org.webcurator.core.permissionmapping.HierPermMappingDAOImpl;
import org.webcurator.core.permissionmapping.HierarchicalPermissionMappingStrategy;
import org.webcurator.core.permissionmapping.PermMappingSiteListener;
import org.webcurator.core.profiles.PolitenessOptions;
import org.webcurator.core.profiles.ProfileManager;
import org.webcurator.core.report.LogonDurationDAOImpl;
import org.webcurator.core.rules.QaRecommendationServiceImpl;
import org.webcurator.core.scheduler.ScheduleJob;
import org.webcurator.core.scheduler.TargetInstanceManagerImpl;
import org.webcurator.core.sites.SiteManagerImpl;
import org.webcurator.core.sites.SiteManagerListener;
import org.webcurator.core.store.DigitalAssetStoreFactoryImpl;
import org.webcurator.core.store.DigitalAssetStoreSOAPClient;
import org.webcurator.core.store.tools.QualityReviewFacade;
import org.webcurator.core.targets.TargetManagerImpl;
import org.webcurator.core.util.AuditDAOUtil;
import org.webcurator.core.util.LockManager;
import org.webcurator.domain.*;
import org.webcurator.domain.model.core.BusinessObjectFactory;
import org.webcurator.domain.model.core.SchedulePattern;
import org.webcurator.ui.groups.controller.GroupSearchController;
import org.webcurator.ui.target.controller.ShowHopPathController;
import org.webcurator.ui.tools.controller.HarvestResourceUrlMapper;
import org.webcurator.ui.tools.controller.QualityReviewToolController;
import org.webcurator.ui.tools.controller.TreeToolController;
import org.webcurator.ui.tools.controller.TreeToolControllerAJAX;
import org.webcurator.ui.tools.validator.TreeToolValidator;
import org.webcurator.ui.util.DateUtils;

import javax.sql.DataSource;
import java.io.IOException;
import java.util.*;

/**
 * Contains configuration that used to be found in {@code wct-core.xml}. This
 * is part of the change to move to using annotations for Spring instead of
 * XML files.
 */
@Configuration
public class BaseConfig {
    private static Logger LOGGER = LoggerFactory.getLogger(BaseConfig.class);

    @Autowired
    private ResourceLoader resourceLoader;

    @Value("${hibernate.dialect}")
    private String hibernateDialect;

    @Value("${hibernate.default_schema}")
    private String hibernateDefaultSchema;

    @Value("${digitalAssetStore.host}")
    private String digitalAssetStoreHost;

    @Value("${digitalAssetStore.port}")
    private int digitalAssetStorePort;

    @Value("${harvestCoordinator.harvestOptimizationEnabled}")
    private boolean harvestOptimizationEnabled;

    @Value("${harvestCoordinator.harvestOptimizationLookaheadHours}")
    private int harvestOptimizationLookaheadHours;

    @Value("${harvestCoordinator.numHarvestersExcludedFromOptimisation}")
    private int numHarvestersExcludedFromOptimisation;

    @Value("${harvestCoordinator.daysBeforeDASPurge}")
    private int daysBeforeDASPurge;

    @Value("${harvestCoordinator.daysBeforeAbortedTargetInstancePurge}")
    private int daysBeforeAbortedTargetInstancePurge;

    @Value("${harvestCoordinator.minimumBandwidth}")
    private int minimumBandwidth;

    @Value("${harvestCoordinator.maxBandwidthPercent}")
    private int maxBandwidthPercent;

    @Value("${harvestCoordinator.autoQAUrl}")
    private String autoQAUrl;

    @Value("${queueController.enableQaModule}")
    private boolean enableQaModule;

    @Value("${queueController.autoPrunedNote}")
    private String autoPrunedNote;

    @Value("${targetInstanceManager.storeSeedHistory}")
    private boolean storeSeedHistory;

    @Value("${targetManager.allowMultiplePrimarySeeds}")
    private boolean allowMultiplePrimarySeeds;

    @Value("${groupTypes.subgroup}")
    private String groupTypesSubgroup;

    @Value("${harvestAgentFactory.daysToSchedule}")
    private int harvestAgentDaysToSchedule;

    @Value("${createNewTargetInstancesTrigger.schedulesPerBatch}")
    private int targetInstancesTriggerSchedulesPerBatch;

    @Value("${project.version}")
    private String projectVersion;

    @Value("${heritrix.version}")
    private String heritrixVersion;

    @Value("${processScheduleTrigger.startDelay}")
    private long processScheduleTriggerStartDelay;

    @Value("${processScheduleTrigger.repeatInterval}")
    private long processScheduleTriggerRepeatInterval;

    @Value("${bandwidthCheckTrigger.startDelay}")
    private long bandwidthCheckTriggerStartDelay;

    @Value("${bandwidthCheckTrigger.repeatInterval}")
    private long bandwidthCheckTriggerRepeatInterval;

    @Value("${mail.protocol}")
    private String mailProtocol;

    @Value("${mailServer.smtp.host}")
    private String mailServerSmtpHost;

    @Value("${mail.smtp.port}")
    private String mailSmtpPort;

    @Value("${bandwidthChecker.warnThreshold}")
    private long bandwidthCheckerWarnThreshold;

    @Value("${bandwidthChecker.errorThreshold}")
    private long bandwidthCheckerErrorThreshold;

    @Value("${checkProcessorTrigger.startDelay}")
    private long checkProcessorTriggerStartDelay;

    @Value("${checkProcessorTrigger.repeatInterval}")
    private long checkProcessorTriggerRepeatInterval;

    @Value("${purgeDigitalAssetsTrigger.repeatInterval}")
    private long purgeDigitalAssetsTriggerRepeatInterval;

    @Value("${purgeAbortedTargetInstancesTrigger.repeatInterval}")
    private long purgeAbortedTargetInstancesTriggerRepeatInterval;

    @Value("${inTrayManager.sender}")
    private String inTrayManagerSender;

    @Value("${inTrayManager.wctBaseUrl}")
    private String inTrayManagerWctBaseUrl;

    @Value("${groupExpiryJobTrigger.startDelay}")
    private long groupExpiryJobTriggerStartDelay;

    @Value("${groupExpiryJobTrigger.repeatInterval}")
    private long groupExpiryJobTriggerRepeatInterval;

    @Value("${createNewTargetInstancesTrigger.startDelay}")
    private long createNewTargetInstancesTriggerStartDelay;

    @Value("${createNewTargetInstancesTrigger.repeatInterval}")
    private long createNewTargetInstancesTriggerRepeatInterval;

    @Value("${archiveAdapter.targetReferenceMandatory}")
    private boolean archiveAdapterTargetReferenceMandatory;

    @Value("${groupSearchController.defaultSearchOnAgencyOnly}")
    private boolean groupSearchControllerDefaultSearchOnAgencyOnly;

    @Value("${groupTypes.subgroupSeparator}")
    private String groupTypesSubgroupSeparator;

    @Value("${harvestResourceUrlMapper.urlMap}")
    private String harvestResourceUrlMapperUrlMap;

    @Value("${qualityReviewToolController.enableAccessTool}")
    private boolean qualityReviewToolControllerEnableAccessTool;

    @Value("${digitalAssetStoreServer.uploadedFilesDir}")
    private String digitalAssetStoreServerUploadedFilesDir;

    @Value("${harvestCoordinator.autoQAUrl}")
    private String harvestCoordinatorAutoQAUrl;

    @Value("${qualityReviewToolController.archiveUrl}")
    private String qualityReviewToolControllerArchiveUrl;

    @Value("${qualityReviewToolController.archiveName}")
    private String qualityReviewToolControllerArchiveName;

    @Value("${qualityReviewToolController.archive.alternative}")
    private String qualityReviewToolControllerArchiveUrlAlternative;

    @Value("${qualityReviewToolController.archive.alternative.name}")
    private String qualityReviewToolControllerArchiveAlternativeName;

    @Value("${qualityReviewToolController.enableBrowseTool}")
    private boolean qualityReviewToolControllerEnableBrowseTool;

    @Value("${qualityReviewToolController.webArchiveTarget}")
    private String qualityReviewToolControllerWebArchiveTarget;

    @Autowired
    private ListsConfig listsConfig;

    // This method is declared static as BeanFactoryPostProcessor types need to be instatiated early. Instance methods
    // interfere with other bean lifecycle instantiations. See {@link Bean} javadoc for more details.
    @Bean
    public static PropertyPlaceholderConfigurer wctCoreConfigurer() {
        PropertyPlaceholderConfigurer bean = new PropertyPlaceholderConfigurer();
        bean.setLocations(new ClassPathResource("wct-core.properties"));
        bean.setIgnoreResourceNotFound(true);
        bean.setIgnoreUnresolvablePlaceholders(true);
        Properties theProperties = new Properties();
        theProperties.setProperty("qualityReviewToolController.archiveName", null);
        theProperties.setProperty("qualityReviewToolController.archive.alternative", null);
        theProperties.setProperty("qualityReviewToolController.archive.alternative.name", null);
        theProperties.setProperty("harvestCoordinator.harvestOptimizationEnabled", "false");
        theProperties.setProperty("harvestCoordinator.harvestOptimizationLookaheadHours", "24");
        theProperties.setProperty("harvestCoordinator.numHarvestersExcludedFromOptimisation", "0");
        bean.setProperties(theProperties);

        return bean;
    }

    @Bean
    public ResourceBundleMessageSource messageSource() {
        ResourceBundleMessageSource bean = new ResourceBundleMessageSource();
        bean.setBasename("messages");

        return bean;
    }

    @Bean
    public LocalSessionFactoryBean sessionFactory() {
        LocalSessionFactoryBean bean = new LocalSessionFactoryBean();
        bean.setDataSource((DataSource) dataSource().getObject());
        // TODO NOTE it would be better if this was a wildcard
//        Resource jarResource = new ClassPathResource("org/webcurator/**");
//        Resource jarResource = new FileSystemResource("/WEB-INF/lib/webcurator-core-3.0.0-SNAPSHOT.jar");
//        Resource jarResource = new ClassPathResource("/WEB-INF/lib/webcurator-core-3.0.0-SNAPSHOT.jar");
        bean.setMappingJarLocations(getHibernateConfigurationResources());
        Properties hibernateProperties = new Properties();
        hibernateProperties.setProperty("hibernate.dialect", hibernateDialect);
        hibernateProperties.setProperty("hibernate.show_sql", "false");
        hibernateProperties.setProperty("hibernate.default_schema", hibernateDefaultSchema);
        hibernateProperties.setProperty("hibernate.transaction.factory_class",
                "org.hibernate.transaction.JDBCTransactionFactory");
        bean.setHibernateProperties(hibernateProperties);

        return bean;
    }

    public Resource[] getHibernateConfigurationResources() {
        Resource[] resources = null;
        try {
            resources = ResourcePatternUtils.getResourcePatternResolver(resourceLoader)
                    .getResources("classpath:/org/webcurator/**/*.hbm.xml");
        } catch (IOException e) {
            LOGGER.error("Unable to load hibernate classpath resources: " + e, e);
        }
        return resources;
    }

    @Bean
    public HibernateTransactionManager transactionManager() {
        return new HibernateTransactionManager(sessionFactory().getObject());
    }

    @Bean
    public TransactionTemplate transactionTemplate() {
        return new TransactionTemplate(transactionManager());
    }

    @Bean
    public JndiObjectFactoryBean dataSource() {
        JndiObjectFactoryBean bean = new JndiObjectFactoryBean();
        bean.setJndiName("java:comp/env/jdbc/wctDatasource");

        return bean;
    }

    @Bean
    @Scope(BeanDefinition.SCOPE_SINGLETON)
    @Lazy(false)
    public DigitalAssetStoreSOAPClient digitalAssetStore() {
        DigitalAssetStoreSOAPClient bean = new DigitalAssetStoreSOAPClient();
        bean.setHost(digitalAssetStoreHost);
        bean.setPort(digitalAssetStorePort);

        return bean;
    }

    @Bean
    @Scope(BeanDefinition.SCOPE_SINGLETON)
    @Lazy(false)
    public DigitalAssetStoreFactoryImpl digitalAssetStoreFactory() {
        DigitalAssetStoreFactoryImpl bean = new DigitalAssetStoreFactoryImpl();
        bean.setDigitalAssetStoreConfig(digitalAssetStore());

        return bean;
    }

    @Bean
    @Scope(BeanDefinition.SCOPE_SINGLETON)
    @Lazy(false)
    public QaRecommendationServiceImpl qaRecommendationService() {
        QaRecommendationServiceImpl bean = new QaRecommendationServiceImpl();
        // The state that will be used to denote a failure within the Rules Engine (eg: an unexpected exception).
        // This state will be returned to the user as the state of the failed indicator along with the exception.
        bean.setStateFailed("Failed");

        // The advice priority is the QA recommendation in rank order, the value of each Map entry being the rank.
        Map<String, Integer> advicePriorityMap = new HashMap<>();
        advicePriorityMap.put("None", 0);
        advicePriorityMap.put("Running", 1);
        advicePriorityMap.put("Archive", 2);
        advicePriorityMap.put("Investigate", 3);
        // Delist has highest priority for a valid indicator since we know that nothing has changed (precluding any other advice).
        advicePriorityMap.put("Delist", 4);
        advicePriorityMap.put("Reject", 5);
        // Failed has the highest priority overall since any failures are unexpected.
        advicePriorityMap.put("Failed", 6);
        bean.setAdvicePriority(advicePriorityMap);

        // Globals objects used by the rules engine.
        Map<String, String> globalsMap = new HashMap<>();
        globalsMap.put("MSG_WITHIN_TOLERANCE", "The {0} indicator value of {1} is within {2}% and {3}% of reference crawl tolerance ({4} &lt;= {5} &lt;= {6})");
        globalsMap.put("MSG_OUTSIDE_TOLERANCE", "The {0} indicator value of {1} is outside {2}% and {3}% of reference crawl tolerance ({5} &lt; {4} or {5} &gt; {6})");
        globalsMap.put("MSG_EXCEEDED_UPPER_LIMIT", "The {0} indicator value of {1} has exceeded its upper limit of {2}");
        globalsMap.put("MSG_FALLEN_BELOW_LOWER_LIMIT", "The {0} indicator value of {1} has fallen below its lower limit of {2}");
        // Advice that will be returned on an indicator.
        globalsMap.put("REJECT", "Reject");
        globalsMap.put("INVESTIGATE", "Investigate");
        globalsMap.put("ARCHIVE", "Archive");
        bean.setGlobals(globalsMap);

        bean.setRulesFileName("rules.drl");
        bean.setQualityReviewFacade(qualityReviewFacade());
        bean.setHarvestCoordinator(harvestCoordinator());
        bean.setTargetInstanceManager(targetInstanceManager());

        return bean;
    }

    @Bean
    public QualityReviewFacade qualityReviewFacade() {
        QualityReviewFacade bean = new QualityReviewFacade();
        bean.setDigialAssetStore(digitalAssetStore());
        bean.setTargetInstanceDao(targetInstanceDao());
        bean.setAuditor(audit());

        return bean;
    }

    @Bean
    public TargetInstanceDAOImpl targetInstanceDao() {
        TargetInstanceDAOImpl bean = new TargetInstanceDAOImpl();
        bean.setSessionFactory(sessionFactory().getObject());
        bean.setTxTemplate(transactionTemplate());
        bean.setAuditor(audit());

        return bean;
    }

    @Bean
    public UserRoleDAO userRoleDAO() {
        UserRoleDAOImpl bean = new UserRoleDAOImpl();
        bean.setSessionFactory(sessionFactory().getObject());
        bean.setTxTemplate(transactionTemplate());

        return bean;
    }

    @Bean
    public RejReasonDAO rejReasonDAO() {
        RejReasonDAOImpl bean = new RejReasonDAOImpl();
        bean.setSessionFactory(sessionFactory().getObject());
        bean.setTxTemplate(transactionTemplate());

        return bean;
    }

    @Bean
    public IndicatorDAO indicatorDAO() {
        IndicatorDAOImpl bean = new IndicatorDAOImpl();
        bean.setSessionFactory(sessionFactory().getObject());
        bean.setTxTemplate(transactionTemplate());

        return bean;
    }

    @Bean
    public IndicatorCriteriaDAO indicatorCriteriaDAO() {
        IndicatorCriteriaDAOImpl bean = new IndicatorCriteriaDAOImpl();
        bean.setSessionFactory(sessionFactory().getObject());
        bean.setTxTemplate(transactionTemplate());

        return bean;
    }

    @Bean
    public IndicatorReportLineDAO indicatorReportLineDAO() {
        IndicatorReportLineDAOImpl bean = new IndicatorReportLineDAOImpl();
        bean.setSessionFactory(sessionFactory().getObject());
        bean.setTxTemplate(transactionTemplate());

        return bean;
    }

    @Bean
    public FlagDAO flagDAO() {
        FlagDAOImpl bean = new FlagDAOImpl();
        bean.setSessionFactory(sessionFactory().getObject());
        bean.setTxTemplate(transactionTemplate());

        return bean;
    }

    @Bean
    public TargetDAO targetDao() {
        TargetDAOImpl bean = new TargetDAOImpl();
        bean.setSessionFactory(sessionFactory().getObject());
        bean.setTxTemplate(transactionTemplate());

        return bean;
    }

    @Bean
    public SiteDAO siteDao() {
        SiteDAOImpl bean = new SiteDAOImpl();
        bean.setSessionFactory(sessionFactory().getObject());
        bean.setTxTemplate(transactionTemplate());

        return bean;
    }

    @Bean
    public ProfileDAO profileDao() {
        ProfileDAOImpl bean = new ProfileDAOImpl();
        bean.setSessionFactory(sessionFactory().getObject());
        bean.setTxTemplate(transactionTemplate());

        return bean;
    }

    @Bean
    public InTrayDAO inTrayDao() {
        InTrayDAOImpl bean = new InTrayDAOImpl();
        bean.setSessionFactory(sessionFactory().getObject());
        bean.setTxTemplate(transactionTemplate());

        return bean;
    }

    @Bean
    public HarvestCoordinatorDAO harvestCoordinatorDao() {
        HarvestCoordinatorDAOImpl bean = new HarvestCoordinatorDAOImpl();
        bean.setSessionFactory(sessionFactory().getObject());
        bean.setTxTemplate(transactionTemplate());

        return bean;
    }

    @Bean
    public HeatmapDAO heatmapConfigDao() {
        HeatmapDAOImpl bean = new HeatmapDAOImpl();
        bean.setSessionFactory(sessionFactory().getObject());
        bean.setTxTemplate(transactionTemplate());

        return bean;
    }

    @Bean
    public PermissionTemplateDAO permissionTemplateDao() {
        PermissionTemplateDAOImpl bean = new PermissionTemplateDAOImpl();
        bean.setSessionFactory(sessionFactory().getObject());
        bean.setTxTemplate(transactionTemplate());

        return bean;
    }

    @Bean
    public SipBuilder sipBuilder() {
        SipBuilder bean = new SipBuilder();
        bean.setTargetInstanceManager(targetInstanceManager());
        bean.setTargetManager(targetManager());

        return bean;
    }

    @Bean
    @Scope(BeanDefinition.SCOPE_SINGLETON)
    public HarvestCoordinatorImpl harvestCoordinator() {
        HarvestCoordinatorImpl bean = new HarvestCoordinatorImpl();
        bean.setTargetInstanceDao(targetInstanceDao());
        bean.setHarvestAgentManager(harvestAgentManager());
        bean.setHarvestLogManager(harvestLogManager());
        bean.setHarvestBandwidthManager(harvestBandwidthManager());
        bean.setHarvestQaManager(harvestQaManager());
        bean.setDigitalAssetStoreFactory(digitalAssetStoreFactory());
        bean.setTargetInstanceManager(targetInstanceManager());
        bean.setTargetManager(targetManager());
        bean.setInTrayManager(inTrayManager());
        bean.setSipBuilder(sipBuilder());
        bean.setHarvestOptimizationEnabled(harvestOptimizationEnabled);
        bean.setHarvestOptimizationLookAheadHours(harvestOptimizationLookaheadHours);
        bean.setNumHarvestersExcludedFromOptimisation(numHarvestersExcludedFromOptimisation);
        bean.setDaysBeforeDASPurge(daysBeforeDASPurge);
        bean.setDaysBeforeAbortedTargetInstancePurge(daysBeforeAbortedTargetInstancePurge);

        return bean;
    }

    @Bean
    public HarvestAgentManagerImpl harvestAgentManager() {
        HarvestAgentManagerImpl bean = new HarvestAgentManagerImpl();
        bean.setHarvestAgentFactory(harvestAgentFactory());
        bean.setTargetInstanceManager(targetInstanceManager());
        bean.setTargetInstanceDao(targetInstanceDao());

        return bean;
    }

    @Bean
    public HarvestLogManagerImpl harvestLogManager() {
        HarvestLogManagerImpl bean = new HarvestLogManagerImpl();
        bean.setHarvestAgentManager(harvestAgentManager());
        bean.setDigitalAssetStoreFactory(digitalAssetStoreFactory());

        return bean;
    }

    @Bean
    public HarvestBandwidthManagerImpl harvestBandwidthManager() {
        HarvestBandwidthManagerImpl bean = new HarvestBandwidthManagerImpl();
        bean.setHarvestAgentManager(harvestAgentManager());
        bean.setTargetInstanceDao(targetInstanceDao());
        bean.setHarvestCoordinatorDao(harvestCoordinatorDao());
        bean.setMinimumBandwidth(minimumBandwidth);
        bean.setMaxBandwidthPercent(maxBandwidthPercent);
        bean.setAuditor(audit());

        return bean;
    }

    @Bean
    public HarvestQaManager harvestQaManager() {
        HarvestQaManagerImpl bean = new HarvestQaManagerImpl();
        bean.setTargetInstanceManager(targetInstanceManager());
        bean.setTargetInstanceDao(targetInstanceDao());
        bean.setAutoQAUrl(autoQAUrl);
        bean.setQaRecommendationService(qaRecommendationService());
        bean.setQualityReviewFacade(qualityReviewFacade());
        bean.setEnableQaModule(enableQaModule);
        bean.setAutoPrunedNote(autoPrunedNote);

        return bean;
    }

    @Bean
    @Scope(BeanDefinition.SCOPE_SINGLETON)
    @Lazy(false)
    @Autowired(required = false) // default when default-autowire="no"
    public TargetInstanceManagerImpl targetInstanceManager() {
        TargetInstanceManagerImpl bean = new TargetInstanceManagerImpl();
        bean.setTargetInstanceDao(targetInstanceDao());
        bean.setAuditor(audit());
        bean.setAnnotationDAO(annotationDao());
        bean.setIndicatorDAO(indicatorDAO());
        bean.setIndicatorCriteriaDAO(indicatorCriteriaDAO());
        bean.setIndicatorReportLineDAO(indicatorReportLineDAO());
        bean.setProfileDAO(profileDao());
        bean.setInTrayManager(inTrayManager());
        bean.setStoreSeedHistory(storeSeedHistory);

        return bean;
    }

    @Bean
    @Scope(BeanDefinition.SCOPE_SINGLETON)
    @Lazy(false)
    @Autowired(required = false) // default when default-autowire="no"
    public LockManager lockManager() {
        return new LockManager();
    }

    @Bean
    @Scope(BeanDefinition.SCOPE_SINGLETON)
    @Lazy(false)
    @Autowired(required = false) // default when default-autowire="no"
    public SiteManagerImpl siteManager() {
        SiteManagerImpl bean = new SiteManagerImpl();
        bean.setSiteDao(siteDao());
        bean.setAnnotationDAO(annotationDao());

        PermMappingSiteListener permMappingSiteListener = new PermMappingSiteListener();
        permMappingSiteListener.setStrategy(permissionMappingStrategy());
        List<SiteManagerListener> permMappingSiteListenerList= new ArrayList<>(
                Arrays.asList(permMappingSiteListener)
        );
        bean.setListeners(permMappingSiteListenerList);

        bean.setIntrayManager(inTrayManager());
        bean.setAuditor(audit());
        bean.setAgencyUserManager(agencyUserManager());

        return bean;
    }

    @Bean
    @Scope(BeanDefinition.SCOPE_SINGLETON)
    @Lazy(false)
    @Autowired(required = false) // default when default-autowire="no"
    public TargetManagerImpl targetManager() {
        TargetManagerImpl bean = new TargetManagerImpl();
        bean.setTargetDao(targetDao());
        bean.setSiteDao(siteDao());
        bean.setAnnotationDAO(annotationDao());
        bean.setAuthMgr(authorityManager());
        bean.setTargetInstanceDao(targetInstanceDao());
        bean.setInstanceManager(targetInstanceManager());
        bean.setIntrayManager(inTrayManager());
        bean.setMessageSource(messageSource());
        bean.setAuditor(audit());
        bean.setBusinessObjectFactory(businessObjectFactory());
        bean.setAllowMultiplePrimarySeeds(allowMultiplePrimarySeeds);
        bean.setSubGroupParentTypesList(listsConfig.subGroupParentTypesList());
        bean.setSubGroupTypeName(groupTypesSubgroup);

        return bean;
    }

    @Bean
    @Scope(BeanDefinition.SCOPE_SINGLETON)
    @Lazy(false)
    @Autowired(required = false) // default when default-autowire="no"
    public ProfileManager profileManager() {
        ProfileManager bean = new ProfileManager();
        bean.setProfileDao(profileDao());
        bean.setAuthorityManager(authorityManager());
        bean.setAuditor(audit());

        return bean;
    }

    @Bean
    public AuditDAOUtil audit() {
        AuditDAOUtil bean = new AuditDAOUtil();
        bean.setSessionFactory(sessionFactory().getObject());
        bean.setTxTemplate(transactionTemplate());

        return bean;
    }

    @Bean
    public LogonDurationDAOImpl logonDuration() {
        LogonDurationDAOImpl bean = new LogonDurationDAOImpl();
        bean.setSessionFactory(sessionFactory().getObject());
        bean.setTxTemplate(transactionTemplate());

        return bean;
    }

    @Bean
    @Scope(BeanDefinition.SCOPE_SINGLETON)
    @Lazy(false)
    @Autowired(required = false) // default when default-autowire="no"
    public HarvestAgentFactoryImpl harvestAgentFactory() {
        return new HarvestAgentFactoryImpl();
    }

    @Bean
    public EnvironmentImpl environmentWCT() {
        EnvironmentImpl bean = new EnvironmentImpl();
        bean.setDaysToSchedule(harvestAgentDaysToSchedule);
        bean.setSchedulesPerBatch(targetInstancesTriggerSchedulesPerBatch);
        bean.setApplicationVersion(projectVersion);
        bean.setHeritrixVersion("Heritrix " + heritrixVersion);

        return bean;
    }

    @Bean
    public SpringSchedulePatternFactory schedulePatternFactory() {
        SpringSchedulePatternFactory bean = new SpringSchedulePatternFactory();

        SchedulePattern schedulePattern = new SchedulePattern();
        schedulePattern.setScheduleType(1);
        schedulePattern.setDescription("Every Monday at 9:00pm");
        schedulePattern.setCronPattern("00 00 21 ? * MON *");

        List<SchedulePattern> schedulePatternList = new ArrayList<>(Arrays.asList(schedulePattern));

        schedulePatternList.add(schedulePattern);

        bean.setPatterns(schedulePatternList);

        return bean;
    }

    @Bean
    @Scope(BeanDefinition.SCOPE_SINGLETON)
    public HierarchicalPermissionMappingStrategy permissionMappingStrategy() {
        HierarchicalPermissionMappingStrategy bean = new HierarchicalPermissionMappingStrategy();
        bean.setDao(permMappingDao());

        return bean;
    }

    @Bean
    public HierPermMappingDAOImpl permMappingDao() {
        HierPermMappingDAOImpl bean = new HierPermMappingDAOImpl();
        bean.setSessionFactory(sessionFactory().getObject());
        bean.setTxTemplate(transactionTemplate());

        return bean;
    }

    @Bean
    public JobDetailBean processScheduleJob() {
        JobDetailBean bean = new JobDetailBean();
        bean.setGroup("ProcessScheduleGroup");
        bean.setName("ProcessSchedule");

        bean.setJobClass(ScheduleJob.class);
        Map<String, Object> jobDataMap = new HashMap<>();
        jobDataMap.put("harvestCoordinator", harvestCoordinator());
        bean.setJobDataAsMap(jobDataMap);

        return bean;
    }

    @Bean
    public SimpleTriggerBean processScheduleTrigger() {
        SimpleTriggerBean bean = new SimpleTriggerBean();
        bean.setGroup("ProcessScheduleTriggerGroup");
        bean.setName("ProcessScheduleTrigger");
        bean.setJobDetail(processScheduleJob());
        // delay before running the job measured in milliseconds
        bean.setStartDelay(processScheduleTriggerStartDelay);
        // repeat every xx milliseconds
        bean.setRepeatInterval(processScheduleTriggerRepeatInterval);

        return bean;
    }

    @Bean
    public MethodInvokingJobDetailFactoryBean checkBandwidthTransitionsJob() {
        MethodInvokingJobDetailFactoryBean bean = new MethodInvokingJobDetailFactoryBean();
        bean.setTargetObject(harvestCoordinator());
        bean.setTargetMethod("checkForBandwidthTransition");

        return bean;
    }

    @Bean
    public SimpleTriggerBean bandwidthCheckTrigger() {
        SimpleTriggerBean bean = new SimpleTriggerBean();
        bean.setGroup("BandwidthCheckTriggerGroup");
        bean.setName("BandwidthCheckTrigger");
        bean.setJobDetail(checkBandwidthTransitionsJob().getObject());
        // delay before running the job measured in milliseconds
        bean.setStartDelay(bandwidthCheckTriggerStartDelay);
        // repeat every xx milliseconds
        bean.setRepeatInterval(bandwidthCheckTriggerRepeatInterval);

        return bean;
    }

    @Bean
    @Scope(BeanDefinition.SCOPE_SINGLETON)
    @Lazy(false)
    @Autowired(required = false) // default when default-autowire="no"
    public SchedulerFactoryBean schedulerFactory() {
        SchedulerFactoryBean bean = new SchedulerFactoryBean();
        bean.setTriggers(processScheduleTrigger(), bandwidthCheckTrigger(), purgeDigitalAssetsTrigger(),
                purgeAbortedTargetInstancesTrigger(), groupExpiryJobTrigger(), createNewTargetInstancesTrigger());

        return bean;
    }

    @Bean
    @Scope(BeanDefinition.SCOPE_SINGLETON)
    @Lazy(false)
    @Autowired(required = false) // default when default-autowire="no"
    public AgencyUserManagerImpl agencyUserManager() {
        AgencyUserManagerImpl bean = new AgencyUserManagerImpl();
        bean.setUserRoleDAO(userRoleDAO());
        bean.setRejReasonDAO(rejReasonDAO());
        bean.setIndicatorCriteriaDAO(indicatorCriteriaDAO());
        bean.setFlagDAO(flagDAO());
        bean.setAuditor(audit());
        bean.setAuthorityManager(authorityManager());
        bean.setProfileManager(profileManager());

        return bean;
    }

    @Bean
    @Scope(BeanDefinition.SCOPE_SINGLETON)
    @Lazy(false)
    @Autowired(required = false) // default when default-autowire="no"
    public AuthorityManagerImpl authorityManager() {
        return new AuthorityManagerImpl();
    }

    @Bean
    public BusinessObjectFactory businessObjectFactory() {
        BusinessObjectFactory bean = new BusinessObjectFactory();
        bean.setProfileManager(profileManager());

        return bean;
    }

    @Bean
    @Scope(BeanDefinition.SCOPE_SINGLETON)
    @Lazy(false)
    @Autowired(required = false) // default when default-autowire="no"
    public AnnotationDAOImpl annotationDao() {
        AnnotationDAOImpl bean = new AnnotationDAOImpl();
        bean.setSessionFactory(sessionFactory().getObject());
        bean.setTxTemplate(transactionTemplate());

        return bean;
    }

    @Bean
    @Scope(BeanDefinition.SCOPE_SINGLETON)
    @Lazy(false)
    @Autowired(required = false) // default when default-autowire="no"
    public MailServerImpl mailServer() {
        Properties properties = new Properties();
        properties.put("mail.transport.protocol", mailProtocol);
        properties.put("mail.smtp.host", mailServerSmtpHost);
        properties.put("mail.smtp.port", mailSmtpPort);

        MailServerImpl bean = new MailServerImpl(properties);

        return bean;
    }

    @Bean
    @Scope(BeanDefinition.SCOPE_SINGLETON)
    @Lazy(false)
    @Autowired(required = false) // default when default-autowire="no"
    public BandwidthChecker bandwidthChecker() {
        BandwidthChecker bean = new BandwidthChecker();
        bean.setWarnThreshold(bandwidthCheckerWarnThreshold);
        bean.setErrorThreshold(bandwidthCheckerErrorThreshold);
        bean.setNotificationSubject("Core");
        bean.setCheckType("Bandwidth");
        bean.setHarvestCoordinator(harvestCoordinator());
        bean.setNotifier(checkNotifier());

        return bean;
    }

    @Bean
    @Scope(BeanDefinition.SCOPE_SINGLETON)
    @Lazy(false)
    @Autowired(required = false) // default when default-autowire="no"
    public CoreCheckNotifier checkNotifier() {
        CoreCheckNotifier bean = new CoreCheckNotifier();
        bean.setInTrayManager(inTrayManager());

        return bean;
    }

    @Bean
    @Scope(BeanDefinition.SCOPE_SINGLETON)
    @Lazy(false)
    @Autowired(required = false) // default when default-autowire="no"
    public CheckProcessor checkProcessor() {
        CheckProcessor bean = new CheckProcessor();

        List<Checker> checksList = new ArrayList<>();
        checksList.add(bandwidthChecker());

        bean.setChecks(checksList);

        return bean;
    }

    @Bean
    public MethodInvokingJobDetailFactoryBean checkProcessorJob() {
        MethodInvokingJobDetailFactoryBean bean = new MethodInvokingJobDetailFactoryBean();
        bean.setTargetObject(checkProcessor());
        bean.setTargetMethod("check");

        return bean;
    }

    @Bean
    public SimpleTriggerBean checkProcessorTrigger() {
        SimpleTriggerBean bean = new SimpleTriggerBean();
        bean.setGroup("CheckProcessorTriggerGroup");
        bean.setName("CheckProcessorTrigger");
        bean.setJobDetail(checkProcessorJob().getObject());
        // delay before running the job measured in milliseconds
        bean.setStartDelay(checkProcessorTriggerStartDelay);
        // repeat every xx milliseconds
        bean.setRepeatInterval(checkProcessorTriggerRepeatInterval);

        return bean;
    }

    @Bean
    public MethodInvokingJobDetailFactoryBean purgeDigitalAssetsJob() {
        MethodInvokingJobDetailFactoryBean bean = new MethodInvokingJobDetailFactoryBean();
        bean.setTargetObject(harvestCoordinator());
        bean.setTargetMethod("purgeDigitalAssets");

        return bean;
    }

    @Bean
    public SimpleTriggerBean purgeDigitalAssetsTrigger() {
        SimpleTriggerBean bean = new SimpleTriggerBean();
        bean.setGroup("PurgeDigitalAssetsTriggerGroup");
        bean.setName("PurgeDigitalAssetsTrigger");
        bean.setJobDetail(purgeDigitalAssetsJob().getObject());
        // interval in milliseconds.  trigger should run every x days
        bean.setRepeatInterval(purgeDigitalAssetsTriggerRepeatInterval);

        return bean;
    }

    @Bean
    public MethodInvokingJobDetailFactoryBean purgeAbortedTargetInstancesJob() {
        MethodInvokingJobDetailFactoryBean bean = new MethodInvokingJobDetailFactoryBean();
        bean.setTargetObject(harvestCoordinator());
        bean.setTargetMethod("purgeAbortedTargetInstances");

        return bean;
    }

    @Bean
    public SimpleTriggerBean purgeAbortedTargetInstancesTrigger() {
        SimpleTriggerBean bean = new SimpleTriggerBean();
        bean.setGroup("PurgeAbortedTargetInstancesTriggerGroup");
        bean.setName("PurgeAbortedTargetInstancesTrigger");
        bean.setJobDetail(purgeAbortedTargetInstancesJob().getObject());
        bean.setRepeatInterval(purgeAbortedTargetInstancesTriggerRepeatInterval);

        return bean;
    }

    @Bean
    @Scope(BeanDefinition.SCOPE_SINGLETON)
    @Lazy(false)
    @Autowired(required = false) // default when default-autowire="no"
    public InTrayManagerImpl inTrayManager() {
        InTrayManagerImpl bean = new InTrayManagerImpl();
        bean.setInTrayDAO(inTrayDao());
        bean.setUserRoleDAO(userRoleDAO());
        bean.setAgencyUserManager(agencyUserManager());
        bean.setMailServer(mailServer());
        bean.setAudit(audit());
        bean.setSender(inTrayManagerSender);
        bean.setMessageSource(messageSource());
        bean.setWctBaseUrl(inTrayManagerWctBaseUrl);

        return bean;
    }

    @Bean
    @Scope(BeanDefinition.SCOPE_SINGLETON)
    @Lazy(false)
    @Autowired(required = false) // default when default-autowire="no"
    public PermissionTemplateManagerImpl permissionTemplateManager() {
        PermissionTemplateManagerImpl bean = new PermissionTemplateManagerImpl();
        bean.setPermissionTemplateDAO(permissionTemplateDao());
        bean.setAuthorityManager(authorityManager());

        return bean;
    }

    @Bean
    public MethodInvokingJobDetailFactoryBean groupExpiryJob() {
        MethodInvokingJobDetailFactoryBean bean = new MethodInvokingJobDetailFactoryBean();
        bean.setTargetObject(targetManager());
        bean.setTargetMethod("endDateGroups");

        return bean;
    }

    @Bean
    public SimpleTriggerBean groupExpiryJobTrigger() {
        SimpleTriggerBean bean = new SimpleTriggerBean();
        bean.setGroup("GroupExpiryJobGroup");
        bean.setName("GroupExpiryJobTrigger");
        bean.setJobDetail(groupExpiryJob().getObject());
        // Delay before running the job measured in milliseconds
        bean.setStartDelay(groupExpiryJobTriggerStartDelay);
        // Repeat every xx milliseconds: this should run at most once a day (86,400,000 millseconds)
        bean.setRepeatInterval(groupExpiryJobTriggerRepeatInterval);

        return bean;
    }

    @Bean
    public MethodInvokingJobDetailFactoryBean createNewTargetInstancesJob() {
        MethodInvokingJobDetailFactoryBean bean = new MethodInvokingJobDetailFactoryBean();
        bean.setTargetObject(targetManager());
        bean.setTargetMethod("processSchedulesJob");

        return bean;
    }

    @Bean
    public SimpleTriggerBean createNewTargetInstancesTrigger() {
        SimpleTriggerBean bean = new SimpleTriggerBean();
        bean.setGroup("createNewTargetInstancesJobGroup");
        bean.setName("createNewTargetInstancesTrigger");
        bean.setJobDetail(createNewTargetInstancesJob().getObject());
        // Delay before running the job measured in milliseconds
        bean.setStartDelay(createNewTargetInstancesTriggerStartDelay);
        // Repeat every xx milliseconds: this should run at most once a day (86,400,000 millseconds)
        bean.setRepeatInterval(createNewTargetInstancesTriggerRepeatInterval);

        return bean;
    }

    @Bean
    @Scope(BeanDefinition.SCOPE_SINGLETON)
    @Lazy(false)
    @Autowired(required = false) // default when default-autowire="no"
    public ArchiveAdapterImpl archiveAdapter() {
        ArchiveAdapterImpl bean = new ArchiveAdapterImpl();
        bean.setDigitalAssetStore(digitalAssetStore());
        bean.setTargetInstanceManager(targetInstanceManager());
        bean.setTargetManager(targetManager());
        bean.setAccessStatusMap(listsConfig.accessStatusMap());
        bean.setTargetReferenceMandatory(archiveAdapterTargetReferenceMandatory);

        return bean;
    }

    @Bean
    public DateUtils dateUtils() {
        return DateUtils.get();
    }

    @Bean
    public GroupSearchController groupSearchController() {
        GroupSearchController bean = new GroupSearchController();
        bean.setTargetManager(targetManager());
        bean.setAgencyUserManager(agencyUserManager());
        bean.setMessageSource(messageSource());
        bean.setDefaultSearchOnAgencyOnly(groupSearchControllerDefaultSearchOnAgencyOnly);
        bean.setGroupTypesList(listsConfig.groupTypesList());
        bean.setSubGroupType(groupTypesSubgroup);
        bean.setSubGroupSeparator(groupTypesSubgroupSeparator);

        return bean;
    }

    @Bean
    public HarvestResourceUrlMapper harvestResourceUrlMapper() {
        HarvestResourceUrlMapper bean = new HarvestResourceUrlMapper();
        bean.setUrlMap(harvestResourceUrlMapperUrlMap);

        return bean;
    }

    @Bean
    @Scope(BeanDefinition.SCOPE_SINGLETON)
    @Lazy(false)
    @Autowired(required = false) // default when default-autowire="no"
    public TreeToolController treeToolController() {
        TreeToolController bean = new TreeToolController();
        bean.setSupportedMethods("GET", "POST");
        bean.setQualityReviewFacade(qualityReviewFacade());
        bean.setValidator(new TreeToolValidator());
        bean.setHarvestResourceUrlMapper(harvestResourceUrlMapper());
        bean.setEnableAccessTool(qualityReviewToolControllerEnableAccessTool);
        bean.setUploadedFilesDir(digitalAssetStoreServerUploadedFilesDir);
        bean.setAutoQAUrl(harvestCoordinatorAutoQAUrl);
        bean.setHarvestLogManager(harvestLogManager());
        bean.setTargetInstanceManager(targetInstanceManager());

        return bean;
    }

    @Bean
    @Scope(BeanDefinition.SCOPE_SINGLETON)
    @Lazy(false)
    @Autowired(required = false) // default when default-autowire="no"
    public TreeToolControllerAJAX treeToolControllerAJAX() {
        TreeToolControllerAJAX bean = new TreeToolControllerAJAX();
        bean.setSupportedMethods("GET", "POST");
        bean.setQualityReviewFacade(qualityReviewFacade());
        bean.setValidator(new TreeToolValidator());
        bean.setHarvestResourceUrlMapper(harvestResourceUrlMapper());

        return bean;
    }

    @Bean
    @Scope(BeanDefinition.SCOPE_SINGLETON)
    @Lazy(false)
    @Autowired(required = false) // default when default-autowire="no"
    public QualityReviewToolController qualityReviewToolController() {
        QualityReviewToolController bean = new QualityReviewToolController();
        bean.setSupportedMethods("GET");
        bean.setTargetInstanceManager(targetInstanceManager());
        bean.setTargetManager(targetManager());
        bean.setArchiveUrl(qualityReviewToolControllerArchiveUrl);
        bean.setArchiveName(qualityReviewToolControllerArchiveName);
        bean.setArchiveUrlAlternative(qualityReviewToolControllerArchiveUrlAlternative);
        bean.setArchiveUrlAlternativeName(qualityReviewToolControllerArchiveAlternativeName);
        bean.setHarvestResourceUrlMapper(harvestResourceUrlMapper());
        bean.setTargetInstanceDao(targetInstanceDao());
        bean.setEnableBrowseTool(qualityReviewToolControllerEnableBrowseTool);
        bean.setEnableAccessTool(qualityReviewToolControllerEnableAccessTool);
        bean.setWebArchiveTarget(qualityReviewToolControllerWebArchiveTarget);

        return bean;
    }

    @Bean
    @Scope(BeanDefinition.SCOPE_SINGLETON)
    @Lazy(false)
    @Autowired(required = false) // default when default-autowire="no"
    public ShowHopPathController showHopPathController() {
        ShowHopPathController bean = new ShowHopPathController();
        bean.setSupportedMethods("GET");
        bean.setHarvestLogManager(harvestLogManager());
        bean.setTargetInstanceManager(targetInstanceManager());

        return bean;
    }

    @Bean
    @Scope(BeanDefinition.SCOPE_SINGLETON)
    @Lazy(false)
    @Autowired(required = false) // default when default-autowire="no"
    public PolitenessOptions politePolitenessOptions() {
        // Delay Factor, Min Delay milliseconds, Max Delay milliseconds,
        // Respect crawl delay up to seconds, Max per host bandwidth usage kb/sec
        return new PolitenessOptions(10.0, 9000L, 90000L, 180L, 400L);
    }

    @Bean
    @Scope(BeanDefinition.SCOPE_SINGLETON)
    @Lazy(false)
    @Autowired(required = false) // default when default-autowire="no"
    public PolitenessOptions mediumPolitenessOptions() {
        // Delay Factor, Min Delay milliseconds, Max Delay milliseconds,
        // Respect crawl delay up to seconds, Max per host bandwidth usage kb/sec
        return new PolitenessOptions(5.0, 3000L, 30000L, 30L, 800L);
    }

    @Bean
    @Scope(BeanDefinition.SCOPE_SINGLETON)
    @Lazy(false)
    @Autowired(required = false) // default when default-autowire="no"
    public PolitenessOptions aggressivePolitenessOptions() {
        // Delay Factor, Min Delay milliseconds, Max Delay milliseconds,
        // Respect crawl delay up to seconds, Max per host bandwidth usage kb/sec
        return new PolitenessOptions(1.0, 1000L, 10000L, 2L, 2000L);
    }
}