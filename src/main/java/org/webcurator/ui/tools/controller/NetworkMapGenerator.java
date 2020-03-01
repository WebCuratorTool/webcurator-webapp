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
import java.util.stream.Collectors;

@SuppressWarnings("all")
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

    public String genResourcesDomain() {
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

        List<String> seedUrl = seeds.stream().map(Seed::getSeed).distinct().collect(Collectors.toList());
        List<String> seedDomain = seeds.stream().map(seed -> URLResolverFunc.url2domain(seed.getSeed())).distinct().collect(Collectors.toList());

        Node.init();
        Map<String, DomainNode> domainMap = new HashMap<>();
        for (HarvestResource harvestResource : resources.values()) {
            String currentDomainName = URLResolverFunc.url2domain(harvestResource.getName());
            if (currentDomainName == null) {
                System.out.println(harvestResource.getName());
                continue;
            }
            DomainNode currentDomain = domainMap.get(currentDomainName);
            if (currentDomain == null) {
                currentDomain = new DomainNode();
                currentDomain.setTitle(currentDomainName);
                if (seedDomain.contains(currentDomainName)) {
                    currentDomain.setSeed(true);
                }
                domainMap.put(currentDomainName, currentDomain);
            }
            currentDomain.increase(harvestResource.getStatusCode(), harvestResource.getLength(), harvestResource.getContentType());
            currentDomain.addNode(harvestResource.getOid());

            String parentDomainName = URLResolverFunc.url2domain(harvestResource.getViaName());
            if (parentDomainName == null) {
                System.out.println(harvestResource.getViaName());
                continue;
            }

            DomainNode parentDomain = domainMap.get(parentDomainName);
            if (parentDomain == null) {
                parentDomain = new DomainNode();
                parentDomain.setTitle(parentDomainName);
                if (seedDomain.contains(parentDomainName)) {
                    parentDomain.setSeed(true);
                }
                domainMap.put(parentDomainName, parentDomain);
            }

            parentDomain.addOutlink(currentDomain.getKey());

        }
        resources.clear();


        ObjectMapper objectMapper = new ObjectMapper();
        try {
            json = objectMapper.writeValueAsString(domainMap.values());
        } catch (JsonProcessingException e) {
            e.printStackTrace();
        }

        domainMap.values().forEach(DomainNode::clear);
        domainMap.clear();

        return json;
    }

    static class Node {
        protected static final int TYPE_URL = 1;
        protected static final int TYPE_DOMAIN = 2;
        protected static AtomicLong IdGenerator = new AtomicLong();

        private long key;
        private String title;
        private boolean isSeed = false; //true: if url equals seed or domain contains seed url.
        private int type; //1: url, 2: domain

        /////////////////////////////////////////////////////////////////////////////////////////
        // 1. Domain: the total items of all urls contained in this domain.
        // 2. URL: the total items of all urls directly link to this url and the url itself
        private int totUrls;
        private int totSuccess;
        private int totFailed;
        private long totSize;
        ///////////////////////////////////////////////////////////////////////////////////////////

        private long domainId = -1; //default: no domain
        private List<Long> outlinks = new ArrayList<>();

        public Node() {
            this.key = IdGenerator.incrementAndGet();
        }

        public Node(int type) {
            this();
            this.type = type;
        }

        public static void init() {
            IdGenerator = new AtomicLong();
        }

        public void addOutlink(long key) {
            if (this.key != key && !this.outlinks.contains(key)) {
                this.outlinks.add(key);
            }
        }

        public void clear() {
            this.outlinks.clear();
        }

        public long getKey() {
            return key;
        }

        public void setKey(long key) {
            this.key = key;
        }


        public boolean isSeed() {
            return isSeed;
        }

        public void setSeed(boolean seed) {
            isSeed = seed;
        }

        public int getType() {
            return type;
        }

        public void setType(int type) {
            this.type = type;
        }

        public int getTotUrls() {
            return totUrls;
        }

        public void increaseTotUrls(int totUrls) {
            this.totUrls += totUrls;
        }

        public int getTotSuccess() {
            return totSuccess;
        }

        public void increaseTotSuccess(int totSuccess) {
            this.totSuccess += totSuccess;
        }

        public int getTotFailed() {
            return totFailed;
        }

        public void increaseTotFailed(int totFailed) {
            this.totFailed += totFailed;
        }

        public long getTotSize() {
            return totSize;
        }

        public void increaseTotSize(long totSize) {
            this.totSize += totSize;
        }

        public long getDomainId() {
            return domainId;
        }

        public void setDomainId(long domainId) {
            this.domainId = domainId;
        }

        public List<Long> getOutlinks() {
            return outlinks;
        }

        public void setOutlinks(List<Long> outlinks) {
            this.outlinks = outlinks;
        }

        public String toString() {
            return String.format("URLs: %d\n\tSuccess: %d\n\tFailed: %d\nSize: %d", this.totUrls, this.totSuccess, this.totFailed, this.totSize);
        }

        public String getTitle() {
            return this.title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public void increase(int statusCode, long contentLength, String contentType) {
            this.increaseTotSize(contentLength);
            if (statusCode == 200) {
                this.increaseTotSuccess(1);
            } else {
                this.increaseTotFailed(1);
            }
            this.increaseTotUrls(1);
        }
    }

    static class UrlNode extends Node {
        private long contentLength;
        private String contentType;
        private long statusCode;

        public UrlNode() {
            super(Node.TYPE_URL);
        }

        public long getContentLength() {
            return contentLength;
        }

        public void setContentLength(long contentLength) {
            this.contentLength = contentLength;
        }

        public String getContentType() {
            return contentType;
        }

        public void setContentType(String contentType) {
            this.contentType = contentType;
        }

        public long getStatusCode() {
            return statusCode;
        }

        public void setStatusCode(long statusCode) {
            this.statusCode = statusCode;
        }
    }

    static class DomainNode extends Node {
        private List<Long> nodes = new ArrayList<>(); //all children
        private Map<String, DomainNode> children = new HashMap<>();

        public DomainNode() {
            super(Node.TYPE_DOMAIN);
        }

        public void addNode(long nodeId) {
            this.nodes.add(nodeId);
        }

        public List<Long> getNodes() {
            return nodes;
        }

        public void setNodes(List<Long> nodes) {
            this.nodes = nodes;
        }

        public Collection<DomainNode> getChildren() {
            return children.values();
        }

        public void setChildren(Map<String, DomainNode> children) {
            this.children = children;
        }

        public void clear() {
            super.clear();
            this.nodes.clear();
            this.children.values().forEach(DomainNode::clear);
            this.children.clear();
        }

        public void increase(int statusCode, long contentLength, String contentType) {
            super.increase(statusCode, contentLength, contentType);

            contentType = URLResolverFunc.trimContentType(contentType);
            DomainNode childDomainNode = this.children.get(contentType);
            if (childDomainNode == null) {
                childDomainNode = new DomainNode();
                this.children.put(contentType, childDomainNode);
            }
            childDomainNode.setTitle(contentType);

            childDomainNode.increaseTotSize(contentLength);
            if (statusCode == 200) {
                childDomainNode.increaseTotSuccess(1);
            } else {
                childDomainNode.increaseTotFailed(1);
            }
            childDomainNode.increaseTotUrls(1);
        }
    }
}
