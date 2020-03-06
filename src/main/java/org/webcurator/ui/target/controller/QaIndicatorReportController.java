/*
 *  Copyright 2006 The National Library of New Zealand
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
package org.webcurator.ui.target.controller;

import java.text.DecimalFormat;
import java.text.NumberFormat;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.NavigableMap;
import java.util.TreeMap;

import javax.annotation.PostConstruct;
import javax.servlet.http.HttpServletRequest;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.beans.propertyeditors.CustomNumberEditor;
import org.springframework.context.MessageSource;
import org.springframework.context.annotation.Lazy;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.ServletRequestDataBinder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.ModelAndView;
import org.webcurator.auth.AuthorityManager;
import org.webcurator.core.agency.AgencyUserManager;
import org.webcurator.core.scheduler.TargetInstanceManager;
import org.webcurator.core.util.AuthUtil;
import org.webcurator.domain.IndicatorDAO;
import org.webcurator.domain.model.auth.Agency;
import org.webcurator.domain.model.auth.Privilege;
import org.webcurator.domain.model.auth.User;
import org.webcurator.domain.model.core.Indicator;
import org.webcurator.domain.model.core.IndicatorCriteria;
import org.webcurator.domain.model.core.IndicatorReportLine;
import org.webcurator.domain.model.core.TargetInstance;
import org.webcurator.ui.admin.command.QaIndicatorCommand;
import org.webcurator.ui.target.command.TargetInstanceCommand;

/**
 * Manages the QA Indicator Administration view and the actions associated with
 * a IndicatorCriteria
 *
 * @author twoods
 */
@Controller
@Scope(BeanDefinition.SCOPE_SINGLETON)
@Lazy(false)
@SuppressWarnings("unchecked")
@RequestMapping(path = "/curator/target/qa-indicator-report.html")
public class QaIndicatorReportController {
	/** the logger. */
	private Log log = null;
    /** The manager to use to access the target instance. */
    @Autowired
    private TargetInstanceManager targetInstanceManager;
	/** The Data access object for indicators. */
	@Autowired
	private IndicatorDAO indicatorDAO;
	/** the agency user manager. */
	@Autowired
	private AgencyUserManager agencyUserManager;
	/** the authority manager. */
	@Autowired
	private AuthorityManager authorityManager;
	/** the sort order for records in the report **/
	private String sortOrder = "countdesc";

	/**
	 * Set of excluded indicators that have alternative reports (ie: report is not built from an IndicatorReportLine).
	 * These indicators have an alternative report representation that is coded in this class.
	**/
	private Map<String, String> excludedIndicators = null;

	/** Default Constructor. */
	public QaIndicatorReportController() {
		log = LogFactory.getLog(QaIndicatorReportController.class);
	}

	@PostConstruct
    protected void init() {
        // These indicators are excluded from the IndicatorReportLine report since they have an alternative
        // representation built by a separate report.
        // The indicator name is specified by the map key and the report for the indicator is the map value.
        Map<String, String> excludedIndicators = new HashMap<>();
        excludedIndicators.put("Robots.txt entries disallowed", "/curator/target/qa-indicator-robots-report.html");
        setExcludedIndicators(excludedIndicators);
    }

    @InitBinder
	protected void initBinder(HttpServletRequest request,
			ServletRequestDataBinder binder) {
		// enable null values for long and float fields
		NumberFormat nf = NumberFormat.getInstance(request.getLocale());
		NumberFormat floatFormat = new DecimalFormat("##############.##");
		binder.registerCustomEditor(java.lang.Long.class,
				new CustomNumberEditor(java.lang.Long.class, nf, true));
		binder.registerCustomEditor(java.lang.Float.class,
				new CustomNumberEditor(java.lang.Float.class, nf, true));
	}

	@GetMapping
	protected ModelAndView showForm(HttpServletRequest request)
			throws Exception {
		ModelAndView mav = new ModelAndView();

		String iOid = request.getParameter("indicatorOid");
		if(iOid == null){
			return mav;
		}

		// prepare the indicator oid
		Long indicatorOid = Long.parseLong(iOid);

		// get the indicator
		Indicator indicator = indicatorDAO.getIndicatorByOid(indicatorOid);

		// add it to the ModelAndView so that we can access it within the jsp
		mav.addObject("indicator", indicator);

		// add the target instance
		TargetInstance instance = targetInstanceManager.getTargetInstance(indicator.getTargetInstanceOid());
		mav.addObject(TargetInstanceCommand.MDL_INSTANCE, instance);

		// ensure that the user belongs to the agency that created the indicator
		if (agencyUserManager.getAgenciesForLoggedInUser().contains(indicator.getAgency())) {
			// summarise the indicator values in the reportLines
			HashMap<String, Integer> summary = new HashMap<String, Integer>();
			NavigableMap<String, Integer> sortedSummary = null;
			int total = 0;
			// if the indicator is not in the exclusion list ...
			if (!excludedIndicators.containsKey(indicator.getName())) {
				// fetch the report lines for this indicator
				List<IndicatorReportLine> reportLines = indicator.getIndicatorReportLines();
				// add them ti the model
				mav.addObject("reportLines", reportLines);

				Comparator comparitor = null;

				Iterator<IndicatorReportLine> lines = reportLines.iterator();

				if (sortOrder.equals("countdesc")) {
					comparitor = new DescendingValueComparator(summary);
					sortedSummary = new TreeMap<String, Integer>(comparitor);
				} else if (sortOrder.equals("countasc")) {
					comparitor = new AscendingValueComparator(summary);
					sortedSummary = new TreeMap<String, Integer>(comparitor);
				} else if (sortOrder.equals("indicatorvaluedesc")) {
					sortedSummary = new TreeMap<String, Integer>().descendingMap();
				} else if (sortOrder.equals("indicatorvalueasc")) {
					sortedSummary = new TreeMap<String, Integer>();
				}

				while (lines.hasNext()) {
					IndicatorReportLine line = lines.next();
					if (summary.containsKey(line.getLine())) {
						// increment the current entry value
						summary.put(line.getLine(),
								summary.get(line.getLine()) + 1);
					} else {
						// initialise the value for the entry
						summary.put(line.getLine(), 1);
					}
					total++;
				}
				sortedSummary.putAll(summary);
				mav.addObject("sortedSummary", sortedSummary);
				mav.addObject("total", total);
				mav.addObject("sortorder", sortOrder);

				mav.setViewName("QaIndicatorReport");
			} else {
				// otherwise redirect to the configured view
				StringBuilder queryString = new StringBuilder("redirect:");
				queryString.append(excludedIndicators.get(indicator.getName()));
				queryString.append("?");
				queryString.append("indicatorOid=");
				queryString.append(indicatorOid);

				return new ModelAndView(queryString.toString());
			}

		}

		return mav;

	}

	@PostMapping
	protected ModelAndView processFormSubmission(@RequestParam(value = "sortorder") String requestSortOrder,
                                                 HttpServletRequest request) throws Exception {
		sortOrder = requestSortOrder;

		return showForm(request);
	}

	/**
	 * Populate the Indicator Criteria list model object in the model and view
	 * provided.
	 *
	 * @param mav
	 *            the model and view to add the user list to.
	 */
	private void populateIndicatorCriteriaList(ModelAndView mav) {
		List<IndicatorCriteria> indicators = agencyUserManager
				.getIndicatorCriteriaForLoggedInUser();
		List<Agency> agencies = null;
		if (authorityManager.hasPrivilege(Privilege.MANAGE_INDICATORS,
				Privilege.SCOPE_ALL)) {
			agencies = agencyUserManager.getAgencies();
		} else {
			User loggedInUser = AuthUtil.getRemoteUserObject();
			Agency usersAgency = loggedInUser.getAgency();
			agencies = new ArrayList<Agency>();
			agencies.add(usersAgency);
		}

		mav.addObject(QaIndicatorCommand.MDL_QA_INDICATORS, indicators);
		mav.addObject(QaIndicatorCommand.MDL_LOGGED_IN_USER,
				AuthUtil.getRemoteUserObject());
		mav.addObject(QaIndicatorCommand.MDL_AGENCIES, agencies);
		mav.setViewName("viewIndicators");
	}

	class DescendingValueComparator implements Comparator {
		Map base;

		public DescendingValueComparator(Map base) {
			this.base = base;
		}

		public int compare(Object a, Object b) {
			if ((Integer) base.get(a) <= (Integer) base.get(b)) {
				return 1;
			} else if ((Integer) base.get(a) == (Integer) base.get(b)) {
				return 0;
			} else {
				return -1;
			}
		}
	}

	class AscendingValueComparator implements Comparator {
		Map base;

		public AscendingValueComparator(Map base) {
			this.base = base;
		}

		public int compare(Object a, Object b) {
			if ((Integer) base.get(a) >= (Integer) base.get(b)) {
				return 1;
			} else if ((Integer) base.get(a) == (Integer) base.get(b)) {
				return 0;
			} else {
				return -1;
			}
		}
	}

	/**
	 * Spring setter method for the <code>IndicatorDAO</code>.
	 *
	 * @param indicatorDAO
	 *            The indicatorDAO to set.
	 */
	public void setIndicatorDAO(IndicatorDAO indicatorDAO) {
		this.indicatorDAO = indicatorDAO;
	}

	/**
	 * @param agencyUserManager
	 *            the agency user manager.
	 */
	public void setAgencyUserManager(AgencyUserManager agencyUserManager) {
		this.agencyUserManager = agencyUserManager;
	}

	/**
	 * Spring setter method for the Authority Manager.
	 *
	 * @param authorityManager
	 *            The authorityManager to set.
	 */
	public void setAuthorityManager(AuthorityManager authorityManager) {
		this.authorityManager = authorityManager;
	}

    /**
     * @param aTargetInstanceManager The targetInstanceManager to set.
     */
    public void setTargetInstanceManager(TargetInstanceManager aTargetInstanceManager) {
        targetInstanceManager = aTargetInstanceManager;
    }

	/**
	 * @param excludedIndicators the excludedIndicators to set
	 */
	public void setExcludedIndicators(Map<String, String> excludedIndicators) {
		this.excludedIndicators = excludedIndicators;
	}
}
