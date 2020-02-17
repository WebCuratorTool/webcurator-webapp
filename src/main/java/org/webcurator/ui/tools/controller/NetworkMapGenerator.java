package org.webcurator.ui.tools.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.webcurator.core.util.URLResolverFunc;
import org.webcurator.domain.TargetInstanceDAO;
import org.webcurator.domain.model.core.HarvestResource;
import org.webcurator.domain.model.core.HarvestResult;
import org.webcurator.domain.model.core.Seed;
import org.webcurator.domain.model.core.TargetInstance;

import java.util.*;
import java.util.concurrent.atomic.AtomicLong;

public class NetworkMapGenerator {
    private TargetInstanceDAO targetInstanceDao;
    private long targetInstanceOid;
    private long harvestResultId;
    private int harvestNumber;

    public NetworkMapGenerator(TargetInstanceDAO targetInstanceDao, long targetInstanceOid, long harvestResultId, int harvestNumber) {
        this.targetInstanceDao = targetInstanceDao;
        this.targetInstanceOid = targetInstanceOid;
        this.harvestResultId = harvestResultId;
        this.harvestNumber = harvestNumber;
    }

    public String genResourcesAll() {
        String json = "{}";
        TargetInstance targetInstance = targetInstanceDao.load(targetInstanceOid);
        if (targetInstance == null) {
            return json;
        }

        HarvestResult harvestResult = targetInstanceDao.getHarvestResult(harvestResultId);
        if (harvestResult == null) {
            return json;
        }

        Map<String, HarvestResource> resources = harvestResult.getResources();
        if (resources == null) {
            return json;
        }

        Set<Seed> seeds = targetInstance.getTarget().getSeeds();
        if (seeds == null) {
            return json;
        }

        final AtomicLong domainIdGenerator = new AtomicLong();
        final ResourceData dataSet = new ResourceData();
        final Map<String, ResourceDomain> domainMap = new HashMap<>();
        resources.forEach((k, v) -> {
            long nodeId = v.getOid();
            long parentId = 0;
            if (resources.containsKey(v.getViaName())) {
                parentId = resources.get(v.getViaName()).getOid();
            }

            ResourceNode node = new ResourceNode();
            node.setId(nodeId);
            node.setParentId(parentId);
            node.setUrl(v.getName());
            dataSet.getNodes().add(node);

            String domainNameFrom = URLResolverFunc.url2domain(v.getViaName());
            ResourceDomain domainFrom = domainMap.get(domainNameFrom);
            if (domainFrom == null) {
                domainFrom = new ResourceDomain();
                domainFrom.setId(domainIdGenerator.incrementAndGet());
                domainFrom.setName(domainNameFrom);
                domainMap.put(domainNameFrom, domainFrom);
            }

            String domainNameTo = URLResolverFunc.url2domain(v.getName());
            ResourceDomain domainTo = domainMap.get(domainNameTo);
            if (domainTo == null) {
                domainTo = new ResourceDomain();
                domainTo.setId(domainIdGenerator.incrementAndGet());
                domainTo.setName(domainNameTo);
                domainMap.put(domainNameTo, domainTo);
            }
            domainTo.getNodes().add(node.getId());

            if (!domainFrom.getOutlinks().contains(domainTo.getId())) {
                domainFrom.getOutlinks().add(domainTo.getId());
            }
        });
        dataSet.setDomains(domainMap.values());

        seeds.forEach(seed -> {
            dataSet.getSeeds().add(seed.getSeed());
        });

        ObjectMapper objectMapper = new ObjectMapper();
        try {
            json = objectMapper.writeValueAsString(dataSet);
        } catch (JsonProcessingException e) {
            e.printStackTrace();
        }

        dataSet.clear();
        domainMap.clear();
        resources.clear();

        return json;
    }

    public String genResourcesDomain() {
        String json = "{}";
        TargetInstance targetInstance = targetInstanceDao.load(targetInstanceOid);
        if (targetInstance == null) {
            return json;
        }
        HarvestResult harvestResult = targetInstance.getHarvestResult(harvestNumber);
        if (harvestResult == null) {
            return json;
        }
        Map<String, HarvestResource> resources = harvestResult.getResources();
        if (resources == null) {
            return json;
        }
        Set<Seed> seeds = targetInstance.getTarget().getSeeds();
        if (seeds == null) {
            return json;
        }

        final AtomicLong domainIdGenerator = new AtomicLong();
        ResourceData dataSet = new ResourceData();
        Map<String, ResourceDomain> domainMap = new HashMap<>();
        resources.forEach((k, v) -> {
            String domainNameFrom = URLResolverFunc.url2domain(v.getViaName());
            ResourceDomain domainFrom = domainMap.get(domainNameFrom);
            if (domainFrom == null) {
                domainFrom = new ResourceDomain();
                domainFrom.setId(domainIdGenerator.incrementAndGet());
                domainFrom.setName(domainNameFrom);
                domainMap.put(domainNameFrom, domainFrom);
            }

            String domainNameTo = URLResolverFunc.url2domain(v.getName());
            ResourceDomain domainTo = domainMap.get(domainNameTo);
            if (domainTo == null) {
                domainTo = new ResourceDomain();
                domainTo.setId(domainIdGenerator.incrementAndGet());
                domainTo.setName(domainNameTo);
                domainMap.put(domainNameTo, domainTo);
            }

            if (!domainFrom.getOutlinks().contains(domainTo.getId())) {
                domainFrom.getOutlinks().add(domainTo.getId());
            }
        });
        dataSet.setDomains(domainMap.values());

        seeds.forEach(seed -> {
            dataSet.getSeeds().add(seed.getSeed());
        });

        ObjectMapper objectMapper = new ObjectMapper();
        try {
            json = objectMapper.writeValueAsString(dataSet);
        } catch (JsonProcessingException e) {
            e.printStackTrace();
        }

        dataSet.clear();
        domainMap.clear();
        resources.clear();

        return json;
    }

    public String genResourcesOneDomain(String domainName) {
        String json = "{}";
        TargetInstance targetInstance = targetInstanceDao.load(targetInstanceOid);
        if (targetInstance == null) {
            return json;
        }

        HarvestResult harvestResult = targetInstanceDao.getHarvestResult(harvestResultId);
        if (harvestResult == null) {
            return json;
        }

        Map<String, HarvestResource> resources = harvestResult.getResources();
        if (resources == null) {
            return json;
        }

        Set<Seed> seeds = targetInstance.getTarget().getSeeds();
        if (seeds == null) {
            return json;
        }

        final ResourceData dataSet = new ResourceData();
        resources.values().stream().filter(v->{
            String tempDomainName=URLResolverFunc.url2domain(v.getName());
            return domainName.equals(tempDomainName);
        }).forEach(v -> {
            long nodeId = v.getOid();
            long parentId = 0;
            if (resources.containsKey(v.getViaName())) {
                parentId = resources.get(v.getViaName()).getOid();
            }

            ResourceNode node = new ResourceNode();
            node.setId(nodeId);
            node.setParentId(parentId);
            node.setUrl(v.getName());
            dataSet.getNodes().add(node);
        });

        seeds.forEach(seed -> {
            dataSet.getSeeds().add(seed.getSeed());
        });

        ObjectMapper objectMapper = new ObjectMapper();
        try {
            json = objectMapper.writeValueAsString(dataSet);
        } catch (JsonProcessingException e) {
            e.printStackTrace();
        }

        dataSet.clear();
        resources.clear();

        return json;
    }

    static class ResourceNode {
        private long id;
        private long parentId;
        private String url;

        public long getId() {
            return id;
        }

        public void setId(long id) {
            this.id = id;
        }

        public long getParentId() {
            return parentId;
        }

        public void setParentId(long parentId) {
            this.parentId = parentId;
        }

        public String getUrl() {
            return url;
        }

        public void setUrl(String url) {
            this.url = url;
        }
    }

    static class ResourceDomain {
        private long id;
        private String name;
        private List<Long> nodes = new ArrayList<>();
        private List<Long> outlinks = new ArrayList<>();

        public long getId() {
            return id;
        }

        public void setId(long id) {
            this.id = id;
        }

        public List<Long> getOutlinks() {
            return outlinks;
        }

        public void setOutlinks(List<Long> outlinks) {
            this.outlinks = outlinks;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public List<Long> getNodes() {
            return nodes;
        }

        public void setNodes(List<Long> nodes) {
            this.nodes = nodes;
        }

        public void clear() {
            this.nodes.clear();
        }
    }

    static class ResourceData {
        private List<String> seeds = new ArrayList<>();
        private List<ResourceNode> nodes = new ArrayList<>();
        private Collection<ResourceDomain> domains = null;

        public List<String> getSeeds() {
            return seeds;
        }

        public void setSeeds(List<String> seeds) {
            this.seeds = seeds;
        }

        public List<ResourceNode> getNodes() {
            return nodes;
        }

        public void setNodes(List<ResourceNode> nodes) {
            this.nodes = nodes;
        }

        public Collection<ResourceDomain> getDomains() {
            return domains;
        }

        public void setDomains(Collection<ResourceDomain> domains) {
            this.domains = domains;
        }

        public void clear() {
            this.seeds.clear();
            this.nodes.clear();
            this.domains.forEach(domain -> {
                domain.getNodes().clear();
            });
            this.domains.clear();
        }
    }
}
