package org.webcurator.ui.tools.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.webcurator.core.util.URLResolverFunc;
import org.webcurator.domain.TargetInstanceDAO;
import org.webcurator.domain.model.core.HarvestResource;
import org.webcurator.domain.model.core.HarvestResult;
import org.webcurator.domain.model.core.Seed;
import org.webcurator.domain.model.core.TargetInstance;

import java.util.*;
import java.util.concurrent.atomic.AtomicLong;

@RestController
public class QaVisualizationController {
    @Autowired
    private TargetInstanceDAO targetInstanceDao;

    @RequestMapping(path = "/curator/qa/ti_resource_all.json", method = {RequestMethod.POST, RequestMethod.GET})
    public String getTargetInstance(@RequestParam("targetInstanceOid") long targetInstanceOid, @RequestParam("harvestResultId") long harvestResultId) {
        NetworkMapGenerator networkMapGenerator = new NetworkMapGenerator(this.targetInstanceDao, targetInstanceOid, harvestResultId);
        return networkMapGenerator.genResourcesAll();
    }


}

