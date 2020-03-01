package org.webcurator.ui.tools.controller;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.webcurator.domain.TargetInstanceDAO;


@RestController
public class QaVisualizationController {
    @Autowired
    private TargetInstanceDAO targetInstanceDao;

    @RequestMapping(path = "/curator/qa/ti_resource_domains.json", method = {RequestMethod.POST, RequestMethod.GET})
    public String getTargetInstance(@RequestParam("targetInstanceOid") long targetInstanceOid, @RequestParam("harvestResultId") long harvestResultId) {
        NetworkMapGenerator networkMapGenerator = new NetworkMapGenerator(this.targetInstanceDao, targetInstanceOid, harvestResultId, 0);
        return networkMapGenerator.genResourcesDomain();
    }


}

